import CardScanner from '@/components/cards/CardScanner';
import ApiKeysWarning from '@/components/cards/ApiKeysWarning';

export default function ScanCardPage() {
  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Scan Trading Card</h1>
        <p className="text-muted-foreground text-lg">
          Upload an image of your trading card to automatically identify and add it to your collection
        </p>
        <p className="text-sm text-muted-foreground">
          Supports Pokémon, One Piece, Lorcana, Magic: The Gathering, and Dragon Ball cards
        </p>
      </div>
      
      {/* API Keys Warning - only show Gemini key warning for scanning */}
      <div className="max-w-4xl mx-auto">
        <ApiKeysWarning 
          requiredKeys={['geminiApiKey']} 
          showDismiss={false}
        />
      </div>
      
      <CardScanner />
    </div>
  );
}
