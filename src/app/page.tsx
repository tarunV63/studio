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
import { AppHeader } from '@/components/app-header';
import { useToast } from '@/hooks/use-toast';

// Dummy data to start with
const initialSongs = [
  { id: '1', name: 'Sample Song 1', content: 'These are the lyrics for the first sample song.' },
  { id: '2', name: 'Sample Song 2', content: 'Lyrics for the second song go here.' },
];

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
  const [lyricsFiles, setLyricsFiles] = useState(initialSongs);
  const [selectedSong, setSelectedSong] = useState(null);
  const [editingFile, setEditingFile] = useState(null);
  const [editingContent, setEditingContent] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const isMobile = useIsMobile();
  const router = useRouter();
  const fileInputRef = useRef(null);
  const { toast } = useToast();

  useEffect(() => {
    // Select the first song on desktop when the component loads or songs change.
    if (!isMobile && lyricsFiles.length > 0 && !selectedSong) {
      setSelectedSong(lyricsFiles[0]);
    }
    
    // Deselect a song if it's deleted.
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

  const handleFileUpload = (event) => {
    const files = event.target.files;
    if (!files) return;

    Array.from(files).forEach(file => {
      if (file.type === 'text/plain') {
        const reader = new FileReader();
        reader.onload = (e) => {
          const content = e.target.result;
          const fileName = file.name.replace('.txt','');
          
          const existingSong = lyricsFiles.find(f => f.name === fileName);
          if (!existingSong) {
             const newFile = { id: Date.now().toString(), name: fileName, content: content as string };
             setLyricsFiles(prevFiles => [...prevFiles, newFile].sort((a, b) => a.name.localeCompare(b.name)));
          } else {
            toast({
                variant: "destructive",
                title: "Song Exists",
                description: `A song named "${fileName}" already exists.`,
            });
          }
        };
        reader.readAsText(file);
      }
    });
     // Reset file input to allow uploading the same file again
    if (fileInputRef.current) {
        fileInputRef.current.value = "";
    }
  };

  const filteredSongs = lyricsFiles.filter(file =>
    file.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDelete = async (songId) => {
    setLyricsFiles(prevFiles => prevFiles.filter(file => file.id !== songId));
  };

  const handleEditSave = async () => {
    if (!editingFile) return;
    setLyricsFiles(prevFiles => 
        prevFiles.map(file => 
            file.id === editingFile.id ? { ...file, content: editingContent } : file
        )
    );
    // Update the selected song view as well
    if(selectedSong?.id === editingFile.id) {
        setSelectedSong(prevSong => ({...prevSong, content: editingContent}));
    }
    setEditingFile(null);
    setEditingContent('');
  };

  const handleShowInNewPage = (songId) => {
    // This will not work correctly without a database, as the view page cannot fetch data.
    // We can pass data via query params for a temporary solution, but it's not ideal for large content.
    const song = lyricsFiles.find(s => s.id === songId);
    if (song) {
        // Storing to session storage to pass to the next page as a workaround
        sessionStorage.setItem('temp_song_view', JSON.stringify(song));
        router.push(`/lyrics/view?id=${songId}`);
    }
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
