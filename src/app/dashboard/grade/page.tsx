import CardGrader from '@/components/cards/CardGrader';
import ApiKeysWarning from '@/components/cards/ApiKeysWarning';

export default function GradeCardPage() {
  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Pre-Grade Your Card</h1>
        <p className="text-muted-foreground text-lg">
          Get a professional grading assessment before sending to PSA, BGS, or CGC
        </p>
        <p className="text-sm text-muted-foreground">
          Upload a clear photo of your card to receive detailed condition analysis and grading score
        </p>
      </div>
      
      {/* API Keys Warning - only show Gemini key warning for grading */}
      <div className="max-w-4xl mx-auto">
        <ApiKeysWarning 
          requiredKeys={['geminiApiKey']} 
          showDismiss={false}
        />
      </div>
      
      <CardGrader />
    </div>
  );
}
