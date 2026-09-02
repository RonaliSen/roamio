import { computed, Injectable, signal } from '@angular/core';
import type { Session } from '@supabase/supabase-js';
import { supabase } from './supabase.client';

@Injectable({ providedIn: 'root' })
export class AuthService {
  readonly session = signal<Session | null>(null);
  readonly isAuthed = computed(() => !!this.session());

  /** Resolves once the initial getSession() call has settled (success or failure). Never rejects. */
  readonly whenReady: Promise<void>;
  private markReady!: () => void;

  constructor() {
    this.whenReady = new Promise<void>((resolve) => (this.markReady = resolve));
    try {
      void supabase.auth
        .getSession()
        .then(({ data }) => this.session.set(data.session))
        .catch(() => undefined)
        .finally(() => this.markReady());
      supabase.auth.onAuthStateChange((_event, session) => this.session.set(session));
    } catch {
      // A network hiccup at construction must not crash the app.
      this.markReady();
    }
  }

  async signIn(email: string, password: string): Promise<{ error: Error | null }> {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
  }

  async signUp(email: string, password: string): Promise<{ error: Error | null }> {
    const { error } = await supabase.auth.signUp({ email, password });
    return { error };
  }

  async signOut(): Promise<{ error: Error | null }> {
    const { error } = await supabase.auth.signOut();
    return { error };
  }
}
