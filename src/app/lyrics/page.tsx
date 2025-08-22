'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useRouter } from 'next/navigation';
import { Trash2, Edit, Eye, Upload } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';

// This is a mock function. In a real app, you'd have server-side logic
// to handle file operations.
async function getFiles() {
  // Check if we are in a browser environment
  if (typeof window !== 'undefined') {
    const files = localStorage.getItem('lyrics_files');
    return files ? JSON.parse(files) : [];
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
          newFiles.push({ name: file.name, content });
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

  if (isLoading) {
    return <div className="p-4">Loading...</div>;
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
                    <Button variant="ghost" size="icon" onClick={() => handleShow(file.name)}>
                      <Eye className="h-5 w-5" />
                    </Button>
                     <Dialog>
                      <DialogTrigger asChild>
                         <Button variant="ghost" size="icon" onClick={() => {
                            setEditingFile(file);
                            setEditingContent(file.content);
                          }}>
                          <Edit className="h-5 w-5" />
                        </Button>
                      </DialogTrigger>
                       {editingFile && editingFile.name === file.name && (
                         <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Edit {editingFile.name}</DialogTitle>
                          </DialogHeader>
                          <Textarea
                            value={editingContent}
                            onChange={(e) => setEditingContent(e.target.value)}
                            rows={15}
                            className="my-4"
                          />
                          <DialogFooter>
                            <DialogClose asChild>
                              <Button variant="outline" onClick={() => setEditingFile(null)}>Cancel</Button>
                            </DialogClose>
                            <DialogClose asChild>
                              <Button onClick={handleEditSave}>Save</Button>
                            </DialogClose>
                          </DialogFooter>
                        </DialogContent>
                       )}
                    </Dialog>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(file.name)} className="text-destructive hover:text-destructive">
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
