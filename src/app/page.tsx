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
import { collection, onSnapshot, doc, addDoc, deleteDoc, updateDoc, query, orderBy, getDocs, writeBatch } from 'firebase/firestore';
import { firestore } from '@/lib/firebase';

const DEMO_SONGS = [
    {
      name: 'Amazing Grace.txt',
      content: `Amazing grace! How sweet the sound
That saved a wretch like me!
I once was lost, but now am found;
Was blind, but now I see.`,
    },
    {
      name: 'Twinkle Twinkle Little Star.txt',
      content: `Twinkle, twinkle, little star,
How I wonder what you are!
Up above the world so high,
Like a diamond in the sky.`,
    },
    {
      name: 'Jingle Bells.txt',
      content: `Dashing through the snow
In a one-horse open sleigh
O'er the fields we go
Laughing all the way`,
    },
     {
      name: 'Let It Be.txt',
      content: `When I find myself in times of trouble, Mother Mary comes to me
Speaking words of wisdom, let it be
And in my hour of darkness she is standing right in front of me
Speaking words of wisdom, let it be`,
    },
    {
      name: 'Stairway to Heaven.txt',
      content: `There's a lady who's sure all that glitters is gold
And she's buying a stairway to heaven
When she gets there she knows, if the stores are all closed
With a word she can get what she came for`,
    },
];

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
      <nav className="flex flex-col p-4 pt-0 space-y-4 overflow-y-auto">
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
  
  // Ref to prevent seeding demo data multiple times
  const seeded = useRef(false);

  useEffect(() => {
    const songsCollection = collection(firestore, 'songs');
    const q = query(songsCollection, orderBy('name'));

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      // Check if the collection is empty and we haven't seeded data yet
      if (snapshot.empty && !seeded.current) {
        seeded.current = true; // Mark as seeded to prevent re-adding
        try {
          const batch = writeBatch(firestore);
          DEMO_SONGS.forEach(song => {
            const docRef = doc(collection(firestore, "songs"));
            batch.set(docRef, song);
          });
          await batch.commit();
          // The onSnapshot listener will be triggered again automatically by the write
        } catch (error) {
            console.error("Error adding demo songs: ", error);
             setIsLoading(false); // Stop loading on error
        }
        return; // Exit early, let the next snapshot handle the state update
      }
      
      const songs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setLyricsFiles(songs);

      // Update selected song if it doesn't exist anymore or on first load
      if (!selectedSong && songs.length > 0 && !isMobile) {
        setSelectedSong(songs[0]);
      } else if (selectedSong) {
          const stillExists = songs.some(s => s.id === selectedSong.id);
          if (!stillExists) {
              setSelectedSong(songs.length > 0 ? songs[0] : null);
          }
      }

      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [isMobile, selectedSong]);


  useEffect(() => {
    const handleSongSelected = (event) => {
      setSelectedSong(event.detail);
    };

    window.addEventListener('song-selected', handleSongSelected);
    return () => {
      window.removeEventListener('song-selected', handleSongSelected);
    };
  }, []);

  const handleFileSelect = (file) => {
    setSelectedSong(file);
  };

  const handleFileUpload = (event) => {
    const files = event.target.files;
    if (!files) return;

    Array.from(files).forEach(file => {
      if (file.type === 'text/plain') {
        const reader = new FileReader();
        reader.onload = async (e) => {
          const content = e.target.result;
          const newFile = { name: file.name, content: content as string };
          
          const existingSong = lyricsFiles.find(f => f.name === file.name);
          if (!existingSong) {
             await addSong(newFile);
          }
        };
        reader.readAsText(file);
      }
    });
  };

  const handleDelete = async (songId) => {
    await deleteSong(songId);
    if (selectedSong && selectedSong.id === songId) {
       const remainingSongs = lyricsFiles.filter(s => s.id !== songId);
       setSelectedSong(remainingSongs.length > 0 ? remainingSongs[0] : null);
    }
  };

  const handleEditSave = async () => {
    if (!editingFile) return;
    await updateSong(editingFile.id, editingContent);
    
    if (selectedSong && selectedSong.id === editingFile.id) {
      setSelectedSong({ ...selectedSong, content: editingContent });
    }

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
    return <div className="p-4 text-center">Loading songs...</div>;
  }

  return (
    <div className="flex h-[calc(100vh-3.5rem)] bg-background">
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
                <h2 className="text-xl font-medium">Select a song to view</h2>
                <p>Or add a new song to get started.</p>
                 {isMobile && (
                  <p className="text-sm mt-4">Click the menu icon above to open the song list.</p>
                )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
