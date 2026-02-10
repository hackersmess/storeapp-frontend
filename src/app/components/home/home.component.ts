import { Component } from '@angular/core';

@Component({
	selector: 'app-home',
	standalone: true,
	template: `
    <div class="home-container">
      <h1>Benvenuto su StoreApp</h1>
      <p>Sistema di gestione vacanze per gruppi</p>
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
    }
  `]
})
export class HomeComponent { }
