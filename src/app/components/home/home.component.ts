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
      padding: 3rem 2rem;
      text-align: center;
    }

    h1 {
      font-size: 3rem;
      font-weight: 700;
      color: var(--color-text-primary);
      margin-bottom: 1rem;
      letter-spacing: -0.03em;
    }

    p {
      font-size: 1.25rem;
      color: var(--color-text-secondary);
      margin-bottom: 4rem;
    }

    .quick-actions {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 2rem;
      max-width: 800px;
      margin: 0 auto;
    }

    .action-card {
      background-color: var(--color-bg-secondary);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-lg);
      padding: 2.5rem;
      text-decoration: none;
      color: inherit;
      transition: all var(--transition-base);
      cursor: pointer;

      &:hover {
        transform: translateY(-6px);
        border-color: var(--color-border-light);
        box-shadow: var(--shadow-xl);
      }

      .icon {
        margin-bottom: 1.5rem;
        color: var(--color-text-primary);
        ng-icon {
          opacity: 0.9;
        }
      }

      h2 {
        font-size: 1.5rem;
        font-weight: 700;
        color: var(--color-text-primary);
        margin-bottom: 0.75rem;
        letter-spacing: -0.01em;
      }

      p {
        font-size: 1rem;
        color: var(--color-text-secondary);
        margin-bottom: 0;
      }
    }
  `]
})
export class HomeComponent { }
