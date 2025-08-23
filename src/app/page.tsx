
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
import { Label } from '@/components/ui/label';
import { firestore } from '@/lib/firebase';
import { collection, getDocs, addDoc, doc, updateDoc, deleteDoc, query, orderBy } from 'firebase/firestore';


// A mock song structure for local state management
const createSong = (id, name, content) => ({
  id,
  name,
  content,
});

export function SidebarContent({ onFileSelect, handleAddSong, searchTerm, setSearchTerm, filteredSongs, selectedSong }) {
  return (
    <div className="flex flex-col h-full bg-background">
      <div className="p-4">
         <AddSongDialog onAddSong={handleAddSong}>
            <Button className="w-full">
              <PlusCircle className="mr-2 h-4 w-4" /> Add Song
            </Button>
        </AddSongDialog>
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
      <nav className="flex flex-col p-4 pt-0 space-y-2 overflow-y-auto">
        {filteredSongs.length > 0 ? (
          filteredSongs.map((song) => (
            <Button
              key={song.id}
              variant={selectedSong?.id === song.id ? "secondary" : "ghost"}
              className="justify-start h-auto text-wrap text-left"
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

function AddSongDialog({ onAddSong, children }) {
  const [isAddManuallyOpen, setIsAddManuallyOpen] = useState(false);
  const [isPrimaryOpen, setIsPrimaryOpen] = useState(false);
  const [manualTitle, setManualTitle] = useState('');
  const [manualContent, setManualContent] = useState('');
  const fileInputRef = useRef(null);
  const { toast } = useToast();

  const handleFileUpload = async (event) => {
    const files = event.target.files;
    if (!files) return;

    const newSongs = [];
    for (const file of Array.from(files)) {
      if (file.type === 'text/plain') {
        const content = await file.text();
        const fileName = file.name.replace('.txt', '');
        newSongs.push({name: fileName, content});
      }
    }
    if(newSongs.length > 0) {
       onAddSong(newSongs);
    }
    
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    setIsPrimaryOpen(false);
  };
  
  const handleManualSave = () => {
    if (manualTitle.trim() && manualContent.trim()) {
      onAddSong([{ name: manualTitle, content: manualContent }]);
      setManualTitle('');
      setManualContent('');
      setIsAddManuallyOpen(false);
      setIsPrimaryOpen(false);
    } else {
        toast({
            variant: "destructive",
            title: "Error",
            description: "Please fill in both title and lyrics.",
        });
    }
  }

  return (
    <Dialog open={isPrimaryOpen} onOpenChange={setIsPrimaryOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="break-words text-left">Add a new song</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-4 py-4">
          <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
            Upload .txt File
          </Button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            className="hidden"
            accept=".txt"
            multiple
          />
           <Dialog open={isAddManuallyOpen} onOpenChange={setIsAddManuallyOpen}>
                <DialogTrigger asChild>
                    <Button>Write Lyrics Manually</Button>
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="break-words text-left">Add Lyrics Manually</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                           <Label htmlFor="song-title">Title</Label>
                           <Input id="song-title" value={manualTitle} onChange={(e) => setManualTitle(e.target.value)} placeholder="Enter song title" />
                        </div>
                         <div className="grid gap-2">
                           <Label htmlFor="song-lyrics">Lyrics</Label>
                           <Textarea id="song-lyrics" value={manualContent} onChange={(e) => setManualContent(e.target.value)} placeholder="Enter song lyrics" rows={10} />
                        </div>
                    </div>
                    <DialogFooter>
                      <DialogClose asChild>
                        <Button variant="outline">Cancel</Button>
                      </DialogClose>
                      <Button onClick={handleManualSave}>Save Song</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
      </DialogContent>
    </Dialog>
  );
}


export default function LyricsManagerPage() {
  const [lyricsFiles, setLyricsFiles] = useState([]);
  const [selectedSong, setSelectedSong] = useState(null);
  const [editingFile, setEditingFile] = useState(null);
  const [editingContent, setEditingContent] = useState('');
  const [editingTitle, setEditingTitle] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const isMobile = useIsMobile();
  const router = useRouter();
  const { toast } = useToast();

  const songsCollectionRef = collection(firestore, 'songs');

  const fetchSongs = useCallback(async () => {
    setIsLoading(true);
    try {
        const q = query(songsCollectionRef, orderBy('name'));
        const data = await getDocs(q);
        const songs = data.docs.map(doc => createSong(doc.id, doc.data().name, doc.data().content));
        setLyricsFiles(songs);
        if (!selectedSong && songs.length > 0 && !isMobile) {
            setSelectedSong(songs[0]);
        }
    } catch (error) {
        console.error("Error fetching songs: ", error);
        toast({
            variant: "destructive",
            title: "Error",
            description: "Could not fetch songs from the database.",
        });
    } finally {
        setIsLoading(false);
    }
  }, [isMobile, toast]);

  useEffect(() => {
    fetchSongs();
  }, [fetchSongs]);

  useEffect(() => {
      if (isMobile === undefined) return; 

      if (isMobile) {
          const isFirstLoad = sessionStorage.getItem('isFirstLoad') !== 'false';
          if (isFirstLoad) {
              setIsSheetOpen(true);
              sessionStorage.setItem('isFirstLoad', 'false');
          }
      }
  }, [isMobile]);

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
      setIsSheetOpen(false);
    }
  };

  const handleAddSong = async (songs) => {
    let addedCount = 0;
    for (const song of songs) {
        try {
            const existingSongs = await getDocs(songsCollectionRef);
            const songExists = existingSongs.docs.some(doc => doc.data().name.toLowerCase() === song.name.toLowerCase());
            
            if (songExists) {
                toast({
                    variant: "destructive",
                    title: "Song Exists",
                    description: `A song named "${song.name}" already exists.`,
                });
                continue;
            }

            await addDoc(songsCollectionRef, { name: song.name, content: song.content });
            addedCount++;
        } catch (error) {
            console.error("Error adding song: ", error);
            toast({
                variant: "destructive",
                title: "Error",
                description: `Could not add song "${song.name}".`,
            });
        }
    }
    if (addedCount > 0) {
        toast({ title: "Success", description: `${addedCount} song(s) added successfully.` });
        fetchSongs();
    }
  };

  const filteredSongs = lyricsFiles.filter(file =>
    file.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDelete = async (songId) => {
    try {
        const songDoc = doc(firestore, 'songs', songId);
        await deleteDoc(songDoc);
        toast({ title: "Success", description: "Song deleted successfully." });
        fetchSongs(); // Refresh list
    } catch (error) {
        console.error("Error deleting song: ", error);
        toast({
            variant: "destructive",
            title: "Error",
            description: "Could not delete the song.",
        });
    }
  };

  const handleEditSave = async () => {
    if (!editingFile) return;
    try {
        const songDoc = doc(firestore, 'songs', editingFile.id);
        await updateDoc(songDoc, { name: editingTitle, content: editingContent });
        toast({ title: "Success", description: "Song updated successfully." });
        setEditingFile(null);
        setEditingContent('');
        setEditingTitle('');
        fetchSongs(); // Refresh list
    } catch (error) {
        console.error("Error updating song: ", error);
        toast({
            variant: "destructive",
            title: "Error",
            description: "Could not update the song.",
        });
    }
  };
  
   const handleShowInNewPage = (songId) => {
    router.push(`/lyrics/view?id=${songId}`);
  };

  const openEditDialog = (file) => {
    setEditingFile(file);
    setEditingTitle(file.name);
    setEditingContent(file.content);
  };

  const closeEditDialog = () => {
    setEditingFile(null);
    setEditingContent('');
    setEditingTitle('');
  };
  
  const sidebarProps = {
    onFileSelect: handleFileSelect,
    handleAddSong: handleAddSong,
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

  return (
    <div className="flex flex-col h-screen">
      <AppHeader onFileSelect={handleFileSelect} onAddSong={handleAddSong} songs={lyricsFiles} isSheetOpen={isSheetOpen} setIsSheetOpen={setIsSheetOpen} />
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
                  <CardTitle className="break-words text-left">{selectedSong.name}</CardTitle>
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
                            <DialogTitle className="break-words text-left">Edit {editingFile?.name}</DialogTitle>
                          </DialogHeader>
                          <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label htmlFor="edit-song-title">Title</Label>
                                <Input 
                                  id="edit-song-title"
                                  value={editingTitle}
                                  onChange={(e) => setEditingTitle(e.target.value)}
                                  placeholder="Enter song title"
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="edit-song-content">Lyrics</Label>
                                <Textarea
                                  id="edit-song-content"
                                  value={editingContent}
                                  onChange={(e) => setEditingContent(e.target.value)}
                                  rows={15}
                                />
                            </div>
                          </div>
                          <DialogFooter>
                            <DialogClose asChild>
                              <Button variant="outline">Cancel</Button>
                            </DialogClose>
                            <Button onClick={handleEditSave}>Save Changes</Button>
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
                       <AddSongDialog onAddSong={handleAddSong}>
                           <Button className="mt-4">
                              <PlusCircle className="mr-2 h-4 w-4" /> Add Song
                           </Button>
                       </AddSongDialog>
                    )}
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
    );
}

    