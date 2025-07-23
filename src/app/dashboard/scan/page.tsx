import CardScanner from '@/components/cards/CardScanner';
import ApiKeysWarning from '@/components/cards/ApiKeysWarning';

export default function ScanCardPage() {
  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Scan Pokémon Card</h1>
        <p className="text-muted-foreground text-lg">
          Upload an image of your Pokémon card to automatically identify and add it to your collection
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
