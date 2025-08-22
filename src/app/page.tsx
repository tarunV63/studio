'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { useRouter } from 'next/navigation';
import { Trash2, Edit, Eye, Music, PlusCircle, Search } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useIsMobile } from '@/hooks/use-mobile';
import { collection, onSnapshot, doc, addDoc, deleteDoc, updateDoc, query, orderBy } from 'firebase/firestore';
import { firestore } from '@/lib/firebase';
import { AppHeader } from '@/components/app-header';

async function addSong(song) {
  await addDoc(collection(firestore, 'songs'), song);
}

async function deleteSong(songId) {
  await deleteDoc(doc(firestore, 'songs', songId));
}

async function updateSong(songId, content) {
  await updateDoc(doc(firestore, 'songs', songId), { content });
}

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
      <nav className="flex flex-col p-4 pt-0 space-y-2 overflow-y-auto">
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
  const [isLoading, setIsLoading] = useState(true);
  const [editingFile, setEditingFile] = useState(null);
  const [editingContent, setEditingContent] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const isMobile = useIsMobile();
  const router = useRouter();
  const fileInputRef = useRef(null);
  const isInitialLoad = useRef(true);
  
  useEffect(() => {
    const songsCollection = collection(firestore, 'songs');
    const q = query(songsCollection, orderBy('name'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const updatedSongs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as any }));
      setLyricsFiles(updatedSongs);

      if (isInitialLoad.current) {
         if (window.innerWidth >= 768 && updatedSongs.length > 0) {
            setSelectedSong(updatedSongs[0]);
        }
        isInitialLoad.current = false;
      }
      
      setSelectedSong(prevSelected => {
        if (!prevSelected) return null;
        const stillExists = updatedSongs.find(s => s.id === prevSelected.id);
        return stillExists ? stillExists : null;
      });

      setIsLoading(false);
    }, (error) => {
      console.error("Error with snapshot listener:", error);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleFileSelect = (file) => {
    setSelectedSong(file);
    if (isMobile) {
      window.dispatchEvent(new CustomEvent('song-selected-mobile'));
    }
  };

  const handleFileUpload = (event) => {
    const files = event.target.files;
    if (!files) return;

    Array.from(files).forEach(file => {
      if (file.type === 'text/plain') {
        const reader = new FileReader();
        reader.onload = async (e) => {
          const content = e.target.result;
          const newFile = { name: file.name.replace('.txt',''), content: content as string };
          
          const existingSong = lyricsFiles.find(f => f.name === newFile.name);
          if (!existingSong) {
             await addSong(newFile);
          }
        };
        reader.readAsText(file);
      }
    });
  };

  const filteredSongs = lyricsFiles.filter(file =>
    file.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDelete = async (songId) => {
    if (selectedSong && selectedSong.id === songId) {
      const currentIndex = filteredSongs.findIndex(s => s.id === songId);
      if (filteredSongs.length > 1) {
        const nextIndex = currentIndex === 0 ? 1 : currentIndex - 1;
        setSelectedSong(filteredSongs[nextIndex]);
      } else {
        setSelectedSong(null);
      }
    }
    await deleteSong(songId);
  };

  const handleEditSave = async () => {
    if (!editingFile) return;
    await updateSong(editingFile.id, editingContent);
    
    setEditingFile(null);
    setEditingContent('');
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
      <div className="flex flex-col h-screen">
        <AppHeader songs={[]} onFileSelect={() => {}} fileInputRef={fileInputRef} handleFileUpload={() => {}} />
        <div className="flex-1 flex items-center justify-center">
            <div className="p-4 text-center">Loading songs...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen">
      <AppHeader songs={lyricsFiles} onFileSelect={handleFileSelect} fileInputRef={fileInputRef} handleFileUpload={handleFileUpload} />
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
