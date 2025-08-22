import { Plus } from 'lucide-react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export default function Home() {
  const feedItems = [
    {
      id: 1,
      user: 'AndroidDevs',
      handle: '@androiddev',
      time: '2h',
      content: 'Just released a new guide on Jetpack Compose theming! Check it out for some cool tips on creating dynamic and beautiful UIs. #AndroidDev #Compose',
      image: 'https://placehold.co/600x400.png',
      imageHint: 'code abstract',
    },
    {
      id: 2,
      user: 'Material Design',
      handle: '@materialdesign',
      time: '5h',
      content: 'Our latest icon set is now available. Perfect for giving your DroidStart app that authentic Android feel. ✨',
      image: 'https://placehold.co/600x300.png',
      imageHint: 'design patterns',
    },
    {
      id: 3,
      user: 'PWA Builders',
      handle: '@pwa',
      time: '1d',
      content: "Don't forget to add a manifest.json and service worker to your web app to make it installable. It's a game-changer for user experience!",
      image: 'https://placehold.co/600x450.png',
      imageHint: 'mobile technology',
    },
     {
      id: 4,
      user: 'Next.js Team',
      handle: '@nextjs',
      time: '2d',
      content: "Building for mobile? Next.js's App Router and PWA capabilities make it easier than ever to create fast, native-like experiences on the web.",
      image: 'https://placehold.co/600x400.png',
      imageHint: 'web development',
    },
  ];

  return (
    <div className="container mx-auto max-w-2xl p-4 space-y-4">
      {feedItems.map((item) => (
        <Card key={item.id} className="overflow-hidden shadow-sm">
          <CardHeader>
            <div className="flex items-center gap-3">
              <Image
                src={`https://placehold.co/40x40.png`}
                alt="User avatar"
                width={40}
                height={40}
                className="rounded-full"
                data-ai-hint="user avatar"
              />
              <div>
                <CardTitle className="text-base font-bold font-headline">{item.user}</CardTitle>
                <CardDescription className="text-sm text-muted-foreground">{item.handle} · {item.time}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="mb-4 text-sm text-foreground/90">{item.content}</p>
            {item.image && (
              <div className="relative aspect-video w-full">
                <Image
                  src={item.image}
                  alt="Post image"
                  fill
                  className="object-cover rounded-lg border"
                  data-ai-hint={item.imageHint}
                />
              </div>
            )}
          </CardContent>
        </Card>
      ))}

      <Button
        size="icon"
        className="fixed bottom-20 right-4 h-14 w-14 rounded-full shadow-lg bg-accent hover:bg-accent/90"
        aria-label="Create new post"
      >
        <Plus className="h-7 w-7" />
      </Button>
    </div>
  );
}
