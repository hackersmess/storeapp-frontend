import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { lucideUsers, lucidePlusCircle } from '@ng-icons/lucide';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink, NgIconComponent],
  providers: [provideIcons({ lucideUsers, lucidePlusCircle })],
  template: `
    <div class="home-container">
      <h1>Benvenuto su StoreApp</h1>
      <p>Sistema di gestione vacanze per gruppi</p>
      
      <div class="quick-actions">
        <a routerLink="/groups" class="action-card">
          <div class="icon">
            <ng-icon name="lucideUsers" size="48"></ng-icon>
          </div>
          <h2>I Miei Gruppi</h2>
          <p>Gestisci i tuoi gruppi di vacanza</p>
        </a>
        
        <a routerLink="/groups/create" class="action-card">
          <div class="icon">
            <ng-icon name="lucidePlusCircle" size="48"></ng-icon>
          </div>
          <h2>Crea Gruppo</h2>
          <p>Inizia a organizzare una nuova vacanza</p>
        </a>
      </div>
    </div>
  `,
  styles: [`
    .home-container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 2rem;
      text-align: center;
    }

    h1 {
      font-size: 2.5rem;
      font-weight: 700;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      margin-bottom: 1rem;
    }

    p {
      font-size: 1.25rem;
      color: #6b7280;
      margin-bottom: 3rem;
    }

    .quick-actions {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 2rem;
      max-width: 800px;
      margin: 0 auto;
    }

    .action-card {
      background: white;
      border-radius: 12px;
      padding: 2rem;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      text-decoration: none;
      color: inherit;
      transition: transform 0.2s, box-shadow 0.2s;
      cursor: pointer;

      &:hover {
        transform: translateY(-4px);
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
      }

      .icon {
        font-size: 3rem;
        margin-bottom: 1rem;
      }

      h2 {
        font-size: 1.5rem;
        font-weight: 700;
        color: #1a1a1a;
        margin-bottom: 0.5rem;
      }

      p {
        font-size: 1rem;
        color: #6b7280;
        margin: 0;
      }
    }
  `]
})
export class HomeComponent { }
