'use client';

import React, { type ReactNode, useEffect, useState } from 'react';
import { app } from '@/lib/firebase'; // This initializes Firebase

export function FirebaseProvider({ children }: { children: ReactNode }) {
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    // The 'app' import initializes Firebase.
    // This effect ensures that we acknowledge initialization.
    if (app) {
      setInitialized(true);
    }
  }, []);

  if (!initialized) {
    // You can return a loader here if needed
    return null; 
  }

  return <>{children}</>;
}
