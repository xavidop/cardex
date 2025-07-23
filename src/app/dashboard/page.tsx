'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScanLine, Sparkles, BookOpen, Camera } from 'lucide-react';

export default function DashboardPage() {
  const router = useRouter();

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold font-headline mb-2">Welcome to your Cardex Dashboard</h1>
        <p className="text-lg text-muted-foreground">
          Manage your Pokémon card collection with ease.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center">
              <ScanLine className="mr-2 h-5 w-5" />
              Scan Cards
            </CardTitle>
            <CardDescription>
              Use your camera to scan and identify Pokemon cards
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link href="/dashboard/scan">
                Start Scanning
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Sparkles className="mr-2 h-5 w-5" />
              Generate Cards
            </CardTitle>
            <CardDescription>
              Create custom Pokemon cards using AI image generation
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link href="/dashboard/generate">
                Generate Card
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Camera className="mr-2 h-5 w-5" />
              Photo Cards
            </CardTitle>
            <CardDescription>
              Transform your photos into Pokemon cards using AI
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link href="/dashboard/generate-from-photo">
                Create Photo Card
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center">
              <BookOpen className="mr-2 h-5 w-5" />
              My Collection
            </CardTitle>
            <CardDescription>
              View and manage your Pokemon card collection
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full" variant="outline">
              <Link href="/dashboard/collection">
                View Collection
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
