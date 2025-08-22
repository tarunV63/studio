'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { useRouter } from 'next/navigation';
import { Trash2, Edit, Eye, Upload } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';

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
    // If no files in localStorage or parsing fails, use sample songs
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

export default function LyricsManagerPage() {
  const [lyricsFiles, setLyricsFiles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingFile, setEditingFile] = useState(null);
  const [editingContent, setEditingContent] = useState('');
  const router = useRouter();
  const fileInputRef = useRef(null);

  useEffect(() => {
    getFiles().then(files => {
      setLyricsFiles(files);
      setIsLoading(false);
    });
  }, []);

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
          // Avoid adding duplicates by name
          if (!newFiles.some(f => f.name === file.name)) {
            newFiles.push({ name: file.name, content });
          }
          processedCount++;
          if (processedCount === files.length) {
            setLyricsFiles(newFiles);
            saveFiles(newFiles);
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
  };

  const handleEditSave = () => {
    if (!editingFile) return;
    const updatedFiles = lyricsFiles.map(file => 
      file.name === editingFile.name ? { ...file, content: editingContent } : file
    );
    setLyricsFiles(updatedFiles);
    saveFiles(updatedFiles);
    setEditingFile(null);
    setEditingContent('');
  };

  const handleShow = (fileName) => {
    const file = lyricsFiles.find(f => f.name === fileName);
    if (file && typeof window !== 'undefined') {
      localStorage.setItem('current_lyrics', file.content);
      router.push(`/lyrics/view`);
    }
  };
  
  const openEditDialog = (file) => {
    setEditingFile(file);
    setEditingContent(file.content);
  }

  const closeEditDialog = () => {
    setEditingFile(null);
    setEditingContent('');
  }

  if (isLoading) {
    return <div className="p-4 text-center">Loading...</div>;
  }

  return (
    <div className="container mx-auto max-w-4xl p-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Lyrics Manager</CardTitle>
          <Button onClick={() => fileInputRef.current?.click()}>
            <Upload className="mr-2 h-4 w-4" /> Add Song(s)
          </Button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            className="hidden"
            accept=".txt"
            multiple
          />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {lyricsFiles.length > 0 ? (
              lyricsFiles.map((file, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-secondary rounded-lg">
                  <span className="font-medium truncate pr-4">{file.name}</span>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" onClick={() => handleShow(file.name)} aria-label={`View ${file.name}`}>
                      <Eye className="h-5 w-5" />
                    </Button>
                    <Dialog open={editingFile?.name === file.name} onOpenChange={(isOpen) => !isOpen && closeEditDialog()}>
                      <DialogTrigger asChild>
                         <Button variant="ghost" size="icon" onClick={() => openEditDialog(file)} aria-label={`Edit ${file.name}`}>
                          <Edit className="h-5 w-5" />
                        </Button>
                      </DialogTrigger>
                       <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Edit {file.name}</DialogTitle>
                        </DialogHeader>
                        <Textarea
                          value={editingContent}
                          onChange={(e) => setEditingContent(e.target.value)}
                          rows={15}
                          className="my-4"
                        />
                        <DialogFooter>
                          <DialogClose asChild>
                            <Button variant="outline" onClick={closeEditDialog}>Cancel</Button>
                          </DialogClose>
                          <Button onClick={handleEditSave}>Save</Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(file.name)} className="text-destructive hover:text-destructive" aria-label={`Delete ${file.name}`}>
                      <Trash2 className="h-5 w-5" />
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center text-muted-foreground py-8">
                <p>No lyric files uploaded.</p>
                <p>Click "Add Song(s)" to upload your .txt files.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}