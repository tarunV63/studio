'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { useRouter } from 'next/navigation';
import { Trash2, Edit, Eye, Music, PlusCircle, Search } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { useIsMobile } from '@/hooks/use-mobile';


const sampleSongs = [
  {
    name: "Sample Song 1.txt",
    content: `(Verse 1)
This is the first line of the first song.
This is the second line, it's not very long.
Here comes the chorus, get ready to sing.
Oh, sample song, you mean everything.

(Chorus)
Sample, sample, oh so grand.
The best example in the land.
Easy to read, easy to see.
A perfect sample for you and me.`
  },
  {
    name: "Sample Song 2.txt",
    content: `(Verse 1)
Woke up this morning, the sky was blue.
Another sample song, just for you.
With simple rhymes and a steady beat.
This lyrical content can't be beat.

(Chorus)
Oh, it's another sample, loud and clear.
To show the feature we hold so dear.
Upload your own, or edit this one.
The lyrics manager is so much fun!`
  }
];

async function getFiles() {
  if (typeof window !== 'undefined') {
    try {
      const files = localStorage.getItem('lyrics_files');
      if (files) {
        return JSON.parse(files);
      }
    } catch (e) {
      console.error("Could not parse lyrics_files from localStorage", e);
    }
    saveFiles(sampleSongs);
    return sampleSongs;
  }
  return [];
}

async function saveFiles(files) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('lyrics_files', JSON.stringify(files));
  }
}

function SidebarContent({ onFileSelect, fileInputRef, handleFileUpload, searchTerm, setSearchTerm, filteredSongs, selectedSong }) {
    const router = useRouter();
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
                    filteredSongs.map((file, index) => (
                        <Button
                            key={index}
                            variant={selectedSong?.name === file.name ? "secondary" : "ghost"}
                            className="justify-start truncate"
                            onClick={() => onFileSelect(file)}
                        >
                            {file.name}
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
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const isMobile = useIsMobile();
  const router = useRouter();
  const fileInputRef = useRef(null);

  useEffect(() => {
    getFiles().then(files => {
      setLyricsFiles(files);
      if (files.length > 0) {
        setSelectedSong(files[0]);
      }
      setIsLoading(false);
    });
  }, []);
  
  const handleFileSelect = (file) => {
    setSelectedSong(file);
    if(isMobile) {
      setIsSheetOpen(false);
    }
  };

  const handleFileUpload = (event) => {
    const files = event.target.files;
    if (!files) return;

    const newFiles = [...lyricsFiles];
    let processedCount = 0;

    Array.from(files).forEach(file => {
      if (file.type === 'text/plain') {
        const reader = new FileReader();
        reader.onload = (e) => {
          const content = e.target.result;
          const newFile = { name: file.name, content: content as string };
          if (!newFiles.some(f => f.name === file.name)) {
            newFiles.push(newFile);
          }
          processedCount++;
          if (processedCount === files.length) {
            setLyricsFiles(newFiles);
            saveFiles(newFiles);
            if (!selectedSong) {
              setSelectedSong(newFile);
            }
          }
        };
        reader.readAsText(file);
      }
    });
  };

  const handleDelete = (fileName) => {
    const updatedFiles = lyricsFiles.filter(file => file.name !== fileName);
    setLyricsFiles(updatedFiles);
    saveFiles(updatedFiles);
    if (selectedSong && selectedSong.name === fileName) {
      setSelectedSong(updatedFiles.length > 0 ? updatedFiles[0] : null);
    }
  };

  const handleEditSave = () => {
    if (!editingFile) return;
    const updatedFiles = lyricsFiles.map(file =>
      file.name === editingFile.name ? { ...file, content: editingContent } : file
    );
    setLyricsFiles(updatedFiles);
    saveFiles(updatedFiles);
    
    if (selectedSong && selectedSong.name === editingFile.name) {
      setSelectedSong({ ...selectedSong, content: editingContent });
    }

    setEditingFile(null);
    setEditingContent('');
  };

  const handleShowInNewPage = (fileName) => {
    const file = lyricsFiles.find(f => f.name === fileName);
    if (file && typeof window !== 'undefined') {
      localStorage.setItem('current_lyrics', file.content);
      router.push(`/lyrics/view`);
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
  
  const filteredSongs = lyricsFiles.filter(file =>
    file.name.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
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
    return <div className="p-4 text-center">Loading...</div>;
  }

  return (
    <div className="flex h-[calc(100vh-3.5rem)] bg-background">
      {isMobile ? (
        <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
          {/* SheetTrigger is now in AppHeader */}
          <SheetContent side="left" className="p-0 w-[300px]">
            <SheetHeader className="p-4 border-b">
                <SheetTitle>Song List</SheetTitle>
            </SheetHeader>
            <SidebarContent {...sidebarProps} />
          </SheetContent>
        </Sheet>
      ) : (
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
                  <Button variant="outline" onClick={() => handleShowInNewPage(selectedSong.name)}>
                    <Eye className="mr-2 h-4 w-4" /> Show
                  </Button>
                  
                  <Dialog open={!!editingFile && editingFile.name === selectedSong.name} onOpenChange={(isOpen) => !isOpen && closeEditDialog()}>
                    <DialogTrigger asChild>
                       <Button variant="outline" onClick={() => openEditDialog(selectedSong)}>
                          <Edit className="mr-2 h-4 w-4" /> Edit
                       </Button>
                    </DialogTrigger>
                     <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Edit {selectedSong.name}</DialogTitle>
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

                  <Button variant="destructive" onClick={() => handleDelete(selectedSong.name)}>
                    <Trash2 className="mr-2 h-4 w-4" /> Delete
                  </Button>
                </div>
            </CardFooter>
          </Card>
        ) : (
          <div className="flex-1 flex items-center justify-center text-center text-muted-foreground">
            <div className="flex flex-col items-center gap-4">
                <Music className="h-16 w-16 text-muted-foreground/50" />
                <h2 className="text-xl font-medium">Select a song to view</h2>
                <p>Or add a new song to get started.</p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
