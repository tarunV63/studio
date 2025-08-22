'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { useRouter } from 'next/navigation';
import { Trash2, Edit, Eye, Music, PlusCircle, Search, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useIsMobile } from '@/hooks/use-mobile';
import { AppHeader } from '@/components/app-header';
import { useToast } from '@/hooks/use-toast';
import { firestore } from '@/lib/firebase';
import { collection, getDocs, addDoc, deleteDoc, doc, updateDoc, query, orderBy } from 'firebase/firestore';

export function SidebarContent({ onFileSelect, fileInputRef, handleFileUpload, searchTerm, setSearchTerm, filteredSongs, selectedSong }) {
  return (
    <div className="flex flex-col h-full bg-background">
      <div className="p-4">
        <Button onClick={() => fileInputRef.current?.click()} className="w-full">
          <PlusCircle className="mr-2 h-4 w-4" /> Add Song
        </Button>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileUpload}
          className="hidden"
          accept=".txt"
          multiple
        />
      </div>
      <div className="p-4 pt-0">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search songs..."
            className="pl-8 w-full"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>
      <nav className="flex flex-col p-4 pt-0 space-y-1 overflow-y-auto">
        {filteredSongs.length > 0 ? (
          filteredSongs.map((song) => (
            <Button
              key={song.id}
              variant={selectedSong?.id === song.id ? "secondary" : "ghost"}
              className="justify-start truncate"
              onClick={() => onFileSelect(song)}
            >
              {song.name}
            </Button>
          ))
        ) : (
          <p className="text-sm text-muted-foreground text-center p-4">No songs found.</p>
        )}
      </nav>
    </div>
  );
}

export default function LyricsManagerPage() {
  const [lyricsFiles, setLyricsFiles] = useState([]);
  const [selectedSong, setSelectedSong] = useState(null);
  const [editingFile, setEditingFile] = useState(null);
  const [editingContent, setEditingContent] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const isMobile = useIsMobile();
  const router = useRouter();
  const fileInputRef = useRef(null);
  const { toast } = useToast();

  const fetchSongs = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      if (!firestore) {
        throw new Error("Firestore is not initialized.");
      }
      const songsCollection = collection(firestore, 'songs');
      const q = query(songsCollection, orderBy('name'));
      const songSnapshot = await getDocs(q);
      const songsList = songSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setLyricsFiles(songsList);
    } catch (err) {
      console.error("Error fetching songs:", err);
      setError("Could not load songs. Please check your connection and Firestore setup.");
      toast({
        variant: "destructive",
        title: "Loading Error",
        description: "Could not load songs. Please try again later.",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);
  
  useEffect(() => {
    fetchSongs();
  }, [fetchSongs]);

  useEffect(() => {
    if (!selectedSong && !isMobile && lyricsFiles.length > 0) {
      setSelectedSong(lyricsFiles[0]);
    }
     if (selectedSong && !lyricsFiles.find(s => s.id === selectedSong.id)) {
        setSelectedSong(isMobile ? null : lyricsFiles[0] || null);
    }
  }, [lyricsFiles, isMobile, selectedSong]);


  const handleFileSelect = (file) => {
    setSelectedSong(file);
    if (isMobile) {
      window.dispatchEvent(new CustomEvent('song-selected-mobile'));
    }
  };

  const handleFileUpload = async (event) => {
    const files = event.target.files;
    if (!files) return;

    for (const file of Array.from(files)) {
      if (file.type === 'text/plain') {
        const content = await file.text();
        const fileName = file.name.replace('.txt', '');

        const existingSong = lyricsFiles.find(f => f.name === fileName);
        if (!existingSong) {
          try {
            const songsCollection = collection(firestore, 'songs');
            const newDocRef = await addDoc(songsCollection, { name: fileName, content: content });
            const newFile = { id: newDocRef.id, name: fileName, content: content };
            setLyricsFiles(prevFiles => [...prevFiles, newFile].sort((a, b) => a.name.localeCompare(b.name)));
          } catch (err) {
             toast({
                variant: "destructive",
                title: "Upload Error",
                description: `Failed to upload song "${fileName}".`,
            });
          }
        } else {
          toast({
            variant: "destructive",
            title: "Song Exists",
            description: `A song named "${fileName}" already exists.`,
          });
        }
      }
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const filteredSongs = lyricsFiles.filter(file =>
    file.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDelete = async (songId) => {
    try {
      const songDoc = doc(firestore, 'songs', songId);
      await deleteDoc(songDoc);
      setLyricsFiles(prevFiles => prevFiles.filter(file => file.id !== songId));
      toast({ title: "Success", description: "Song deleted successfully." });
    } catch (err) {
       toast({
          variant: "destructive",
          title: "Delete Error",
          description: "Failed to delete the song.",
       });
    }
  };

  const handleEditSave = async () => {
    if (!editingFile) return;
    try {
      const songDoc = doc(firestore, 'songs', editingFile.id);
      await updateDoc(songDoc, { content: editingContent });
      setLyricsFiles(prevFiles =>
        prevFiles.map(file =>
          file.id === editingFile.id ? { ...file, content: editingContent } : file
        )
      );
      if (selectedSong?.id === editingFile.id) {
        setSelectedSong(prevSong => ({ ...prevSong, content: editingContent }));
      }
      setEditingFile(null);
      setEditingContent('');
      toast({ title: "Success", description: "Song updated successfully." });
    } catch (err) {
       toast({
          variant: "destructive",
          title: "Update Error",
          description: "Failed to save changes.",
       });
    }
  };
  
   const handleShowInNewPage = (songId) => {
    router.push(`/lyrics/view?id=${songId}`);
  };

  const openEditDialog = (file) => {
    setEditingFile(file);
    setEditingContent(file.content);
  };

  const closeEditDialog = () => {
    setEditingFile(null);
    setEditingContent('');
  };
  
  const sidebarProps = {
    onFileSelect: handleFileSelect,
    fileInputRef,
    handleFileUpload,
    searchTerm,
    setSearchTerm,
    filteredSongs,
    selectedSong
  };

  if (isLoading) {
    return (
        <div className="flex h-screen items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin" />
        </div>
    );
  }

  if (error) {
     return (
        <div className="flex h-screen items-center justify-center text-center text-destructive">
            <p>{error}</p>
        </div>
    );
  }

  return (
    <div className="flex flex-col h-screen">
      <AppHeader onFileSelect={handleFileSelect} fileInputRef={fileInputRef} handleFileUpload={handleFileUpload} songs={lyricsFiles} />
      <div className="flex flex-1 pt-14 h-[calc(100vh-3.5rem)] bg-background">
          {!isMobile && (
            <aside className="w-1/3 min-w-[250px] max-w-[350px] border-r">
              <SidebarContent {...sidebarProps} />
            </aside>
          )}

          <main className="flex-1 flex flex-col p-4">
            {selectedSong ? (
              <Card className="flex-1 flex flex-col">
                <CardHeader>
                  <CardTitle className="truncate">{selectedSong.name}</CardTitle>
                </CardHeader>
                <CardContent className="flex-1 overflow-y-auto">
                  <pre className="whitespace-pre-wrap font-body text-base leading-relaxed">
                    {selectedSong.content}
                  </pre>
                </CardContent>
                <CardFooter className="bg-muted/50 p-3 mt-auto border-t">
                   <div className="flex items-center gap-2">
                      <Button variant="outline" onClick={() => handleShowInNewPage(selectedSong.id)}>
                        <Eye className="mr-2 h-4 w-4" /> Show
                      </Button>
                      
                      <Dialog open={!!editingFile && editingFile.id === selectedSong.id} onOpenChange={(isOpen) => !isOpen && closeEditDialog()}>
                        <DialogTrigger asChild>
                           <Button variant="outline" onClick={() => openEditDialog(selectedSong)}>
                              <Edit className="mr-2 h-4 w-4" /> Edit
                           </Button>
                        </DialogTrigger>
                         <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Edit {editingFile?.name}</DialogTitle>
                          </DialogHeader>
                          <Textarea
                            value={editingContent}
                            onChange={(e) => setEditingContent(e.target.value)}
                            rows={15}
                            className="my-4"
                          />
                          <DialogFooter>
                            <DialogClose asChild>
                              <Button variant="outline">Cancel</Button>
                            </DialogClose>
                            <Button onClick={handleEditSave}>Save</Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>

                      <Button variant="destructive" onClick={() => handleDelete(selectedSong.id)}>
                        <Trash2 className="mr-2 h-4 w-4" /> Delete
                      </Button>
                    </div>
                </CardFooter>
              </Card>
            ) : (
              <div className="flex-1 flex items-center justify-center text-center text-muted-foreground">
                <div className="flex flex-col items-center gap-4">
                    <Music className="h-16 w-16 text-muted-foreground/50" />
                    <h2 className="text-xl font-medium">{lyricsFiles.length > 0 ? "Select a song" : "No songs found"}</h2>
                    <p>{lyricsFiles.length > 0 ? "Choose a song from the list to see its lyrics." : "Add a new song to get started."}</p>
                     {isMobile && !lyricsFiles.length && (
                       <Button onClick={() => fileInputRef.current?.click()} className="mt-4">
                          <PlusCircle className="mr-2 h-4 w-4" /> Add Song
                       </Button>
                    )}
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
    );
}
