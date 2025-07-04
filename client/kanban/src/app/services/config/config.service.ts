import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ConfigService {
  private config = {
    apiUrl: environment.APP_URL,
    production: environment.production || false
  };

  constructor() {
    this.loadConfig();
  }

  private loadConfig(): void {
    const configElement = document.getElementById('app-config');
    if (configElement) {
      try {
        const runtimeConfig = JSON.parse(configElement.textContent || '{}');
        this.config = { ...this.config, ...runtimeConfig };
      } catch (error) {
        console.warn('Failed to parse runtime config, using environment defaults');
      }
    }
  }

  get apiUrl(): string {
    return this.config.apiUrl;
  }

  get production(): boolean {
    return this.config.production;
  }

  getConfig(): any {
    return { ...this.config };
  }
} 