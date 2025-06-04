'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Pencil, Trash2 } from 'lucide-react';
import type { PokemonCard } from '@/types';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface CardItemProps {
  card: PokemonCard;
  onDelete: (cardId: string) => void;
  isDeleting: boolean;
}

export default function CardItem({ card, onDelete, isDeleting }: CardItemProps) {
  return (
    <Card className="flex flex-col overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300">
      <CardHeader className="p-4">
        <CardTitle className="text-lg font-semibold truncate font-headline" title={card.name}>{card.name}</CardTitle>
        <CardDescription className="text-xs text-muted-foreground">
          Set: {card.set} | Rarity: {card.rarity}
        </CardDescription>
      </CardHeader>
      <CardContent className="p-4 flex-grow flex justify-center items-center bg-muted/30">
        {card.imageDataUrl ? (
          <Image
            src={card.imageDataUrl}
            alt={card.name}
            width={200}
            height={280}
            className="object-contain rounded-md aspect-[63/88] max-w-[150px]"
            data-ai-hint="pokemon card"
          />
        ) : (
          <div className="w-[200px] h-[280px] bg-gray-200 flex items-center justify-center rounded-md text-muted-foreground aspect-[63/88]">
            No Image
          </div>
        )}
      </CardContent>
      <CardFooter className="p-4 bg-card border-t flex justify-end space-x-2">
        <Button variant="outline" size="sm" asChild>
          <Link href={`/dashboard/collection/${card.id}/edit`}>
            <Pencil className="h-3 w-3 mr-1" /> Edit
          </Link>
        </Button>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" size="sm" disabled={isDeleting}>
              <Trash2 className="h-3 w-3 mr-1" /> Delete
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the card &quot;{card.name}&quot; from your collection.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={() => onDelete(card.id)} className="bg-destructive hover:bg-destructive/90">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardFooter>
    </Card>
  );
}
