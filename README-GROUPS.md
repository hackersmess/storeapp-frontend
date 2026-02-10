# Modulo Gestione Gruppi - Frontend

## Panoramica

Questo modulo gestisce la funzionalità completa dei gruppi nell'applicazione StoreApp, permettendo agli utenti di creare, modificare, visualizzare ed eliminare gruppi, oltre a gestire i membri.

## Struttura

```
frontend/src/app/
├── models/
│   └── group.model.ts              # Interfacce TypeScript per gruppi e membri
├── services/
│   └── group.service.ts            # Servizio per le chiamate API
└── components/
    └── groups/
        ├── groups-list/            # Lista dei gruppi dell'utente
        │   ├── groups-list.component.ts
        │   ├── groups-list.component.html
        │   └── groups-list.component.scss
        ├── group-form/             # Form per creare/modificare gruppi
        │   ├── group-form.component.ts
        │   ├── group-form.component.html
        │   └── group-form.component.scss
        └── group-detail/           # Dettagli di un gruppo
            ├── group-detail.component.ts
            ├── group-detail.component.html
            └── group-detail.component.scss
```

## Modelli

### Group

```typescript
interface Group {
  id: number;
  name: string;
  description?: string;
  vacationStartDate?: string;
  vacationEndDate?: string;
  coverImageUrl?: string;
  createdBy: UserDto;
  createdAt: string;
  updatedAt: string;
  memberCount: number;
  members?: GroupMember[];
}
```

### GroupMember

```typescript
interface GroupMember {
  id: number;
  groupId: number;
  user: UserDto;
  role: GroupRole;
  joinedAt: string;
}
```

### GroupRole

```typescript
enum GroupRole {
  ADMIN = 'ADMIN',
  MEMBER = 'MEMBER',
}
```

## Funzionalità

### 1. Lista Gruppi (`groups-list`)

- **Route**: `/groups`
- **Funzionalità**:
  - Visualizza tutti i gruppi dell'utente corrente
  - Mostra preview delle informazioni gruppo (cover image, date, numero membri)
  - Click su un gruppo per visualizzare i dettagli
  - Pulsante per creare un nuovo gruppo

### 2. Creazione/Modifica Gruppo (`group-form`)

- **Route**: `/groups/create` (creazione), `/groups/:id/edit` (modifica)
- **Funzionalità**:
  - Form validato per inserimento dati gruppo
  - **Ricerca utenti** tramite username o email (con debounce)
  - Selezione membri con assegnazione ruolo (Admin/Membro)
  - Gestione ruoli membri prima della creazione
  - Anteprima membri selezionati
  - Validazione form con messaggi di errore

#### Ricerca Membri

Il componente include una funzionalità avanzata di ricerca utenti:

- Ricerca in tempo reale con debounce (300ms)
- Filtra per username o email
- Esclude membri già selezionati
- Dropdown con risultati clickabili
- Avatar placeholder per utenti senza immagine

### 3. Dettaglio Gruppo (`group-detail`)

- **Route**: `/groups/:id`
- **Funzionalità**:
  - Visualizza tutte le informazioni del gruppo
  - Cover image di sfondo
  - Lista completa dei membri con avatar
  - Azioni per amministratori:
    - Modifica gruppo
    - Elimina gruppo (con conferma)
    - Aggiungi/rimuovi membri
    - Cambia ruolo membri
  - Azione per membri standard:
    - Abbandona gruppo

## API Endpoints Utilizzati

Il servizio `GroupService` comunica con i seguenti endpoint backend:

```typescript
// Gruppi
POST   /api/groups                          // Crea nuovo gruppo
GET    /api/groups                          // Lista gruppi utente
GET    /api/groups/:id                      // Dettagli gruppo
PUT    /api/groups/:id                      // Aggiorna gruppo
DELETE /api/groups/:id                      // Elimina gruppo

// Membri
GET    /api/groups/:id/members              // Lista membri
POST   /api/groups/:id/members              // Aggiungi membro
DELETE /api/groups/:groupId/members/:memberId  // Rimuovi membro
PUT    /api/groups/:groupId/members/:memberId/role  // Cambia ruolo
POST   /api/groups/:id/leave                // Abbandona gruppo

// Utenti (per ricerca)
GET    /api/users                           // Lista tutti gli utenti
```

## Validazioni

### Form Creazione Gruppo

- **Nome**: Obbligatorio, min 3 caratteri, max 200 caratteri
- **Descrizione**: Opzionale, max 2000 caratteri
- **Date**: Opzionali
- **Cover Image URL**: Opzionale, max 500 caratteri

### Aggiunta Membri

- Almeno uno tra email o username deve essere presente
- Email deve essere valida
- Ruolo è obbligatorio (default: MEMBER)

## Stili e UI/UX

- **Design**: Material-inspired con gradient viola (#667eea → #764ba2)
- **Responsive**: Grid layout che si adatta a diversi schermi
- **Animazioni**: Transizioni smooth su hover e interazioni
- **Loading States**: Spinner durante caricamenti
- **Error Handling**: Messaggi di errore chiari e azioni di retry

## Uso

### Creare un Gruppo

1. Naviga a `/groups`
2. Click su "Crea Nuovo Gruppo"
3. Compila il form con le informazioni del gruppo
4. Cerca e aggiungi membri (opzionale)
5. Assegna i ruoli ai membri
6. Click su "Crea Gruppo"

### Gestire Membri

1. Apri il dettaglio di un gruppo
2. Gli amministratori possono:
   - Aggiungere nuovi membri (pulsante "Aggiungi Membro")
   - Rimuovere membri esistenti (icona cestino)
   - Cambiare ruolo membri (icona scudo)

### Modificare un Gruppo

1. Apri il dettaglio di un gruppo
2. Click su "Modifica" (solo admin)
3. Modifica i campi desiderati
4. Click su "Salva Modifiche"

## Sicurezza

- Tutte le route richiedono autenticazione (`authGuard`)
- Solo gli amministratori possono:
  - Modificare il gruppo
  - Eliminare il gruppo
  - Aggiungere/rimuovere membri
  - Cambiare ruoli
- I membri standard possono solo abbandonare il gruppo

## Prossimi Sviluppi

- [ ] Inviti via email per nuovi membri
- [ ] Notifiche push quando si viene aggiunti a un gruppo
- [ ] Upload cover image diretto (non solo URL)
- [ ] Filtri e ricerca nella lista gruppi
- [ ] Ordinamento gruppi (per data, nome, membri)
- [ ] Paginazione per gruppi numerosi
- [ ] Integrazione con moduli foto, eventi, spese, documenti

## Note Tecniche

- **Standalone Components**: Tutti i componenti usano l'architettura standalone di Angular
- **Reactive Forms**: Gestione form con validazione reattiva
- **RxJS**: Observable e operators per gestione asincrona (debounceTime, distinctUntilChanged, switchMap)
- **Lazy Loading**: I componenti gruppi sono caricati lazy per ottimizzare le performance
