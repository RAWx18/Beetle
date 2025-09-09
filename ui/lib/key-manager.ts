"use client";

import { useLocalStorage } from '@/contexts/LocalStorageContext';

class KeyManager {
  private localStorage: any;

  constructor(localStorage: any) {
    this.localStorage = localStorage;
  }

  public getGitmeshToken(): string | null {
    return this.localStorage.getItem('gitmesh_token');
  }

  public setGitmeshToken(token: string): void {
    this.localStorage.setItem('gitmesh_token', token);
  }

  public removeGitmeshToken(): void {
    this.localStorage.removeItem('gitmesh_token');
  }
}

export default KeyManager;
