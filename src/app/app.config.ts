import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { getAuth, provideAuth } from '@angular/fire/auth';
import { getFirestore, provideFirestore } from '@angular/fire/firestore';
import { getDatabase, provideDatabase } from '@angular/fire/database';

export const appConfig: ApplicationConfig = {
  providers: [provideZoneChangeDetection({ eventCoalescing: true }), provideRouter(routes), provideFirebaseApp(() => initializeApp({"projectId":"auction-bazar-db","appId":"1:570787756626:web:0bd461a22aa2b4a1243d8b","storageBucket":"auction-bazar-db.firebasestorage.app","apiKey":"AIzaSyAZh8itdyLPbmDangQ2c8yIKuGrxaYrxVI","authDomain":"auction-bazar-db.firebaseapp.com","messagingSenderId":"570787756626"})), provideAuth(() => getAuth()), provideFirestore(() => getFirestore()), provideDatabase(() => getDatabase())]
};
