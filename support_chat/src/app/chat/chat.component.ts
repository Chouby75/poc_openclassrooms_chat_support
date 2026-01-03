import { Component, OnInit, ViewChild, ElementRef, AfterViewChecked, OnDestroy } from '@angular/core';
import { MessageService } from '../message.service';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule, DatePipe } from '@angular/common';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [FormsModule, CommonModule, DatePipe],
  template: `
    <div class="chat-layout">
      <header class="chat-header">
        <div class="user-info">
          <div class="avatar">{{ currentUser.charAt(0).toUpperCase() }}</div>
          <div>
            <h3>Support Chat</h3>
            <span class="status">Logged in as {{ currentUser }}</span>
            <span class="live-indicator">● Live</span>
          </div>
        </div>
        <div class="actions">
            <!-- Refresh button removed as it's no longer needed with WebSocket, but kept for manual sync if connection fails -->
            <button (click)="loadMessages()" class="btn-icon" title="Force Refresh">↻</button>
            <button (click)="logout()" class="btn-logout">Logout</button>
        </div>
      </header>

      <div class="messages-container" #scrollContainer>
        <div *ngIf="messages.length === 0" class="empty-state">
            No messages yet. Start the conversation!
        </div>
        
        <div *ngFor="let msg of messages" 
             class="message-wrapper" 
             [class.my-message-wrapper]="msg.author === currentUser"
             [class.other-message-wrapper]="msg.author !== currentUser">
             
          <div class="message-bubble">
            <div class="meta" *ngIf="msg.author !== currentUser">{{ msg.author }}</div>
            <div class="content">{{ msg.content }}</div>
            <div class="timestamp">{{ msg.timestamp | date:'shortTime' }}</div>
          </div>
        </div>
      </div>

      <footer class="chat-input-area">
        <input type="text" 
               [(ngModel)]="newMessage" 
               (keyup.enter)="sendMessage()" 
               placeholder="Type a message..."
               class="message-input">
        <button (click)="sendMessage()" [disabled]="!newMessage.trim()" class="btn-send">
            Send
        </button>
      </footer>
    </div>
  `,
  styles: [`
    .chat-layout {
      display: flex;
      flex-direction: column;
      height: 100vh;
      background-color: #f5f7fb;
      max-width: 900px;
      margin: 0 auto;
      box-shadow: 0 0 20px rgba(0,0,0,0.05);
    }

    /* Header */
    .chat-header {
      background: white;
      padding: 1rem 1.5rem;
      border-bottom: 1px solid #e6e6e6;
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-shrink: 0;
    }

    .user-info { display: flex; align-items: center; gap: 1rem; }
    .avatar {
        width: 40px; height: 40px; background: #667eea; color: white;
        border-radius: 50%; display: flex; align-items: center; justify-content: center;
        font-weight: bold; font-size: 1.2rem;
    }
    h3 { margin: 0; font-size: 1.1rem; }
    .status { font-size: 0.8rem; color: #888; }
    .live-indicator { color: #2ecc71; font-size: 0.8rem; margin-left: 5px; animation: pulse 2s infinite; }
    
    @keyframes pulse {
        0% { opacity: 1; }
        50% { opacity: 0.5; }
        100% { opacity: 1; }
    }

    .actions { display: flex; gap: 0.5rem; }
    .btn-logout {
        padding: 0.5rem 1rem;
        background: #fff0f0; color: #d63031;
        border: 1px solid #fadcdc; border-radius: 6px;
        cursor: pointer;
    }
    .btn-icon {
        background: none; border: none; font-size: 1.5rem; cursor: pointer; color: #666;
    }

    /* Messages Area */
    .messages-container {
      flex-grow: 1;
      padding: 1.5rem;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .empty-state { text-align: center; color: #999; margin-top: 2rem; }

    .message-wrapper {
        display: flex;
        width: 100%;
    }
    .my-message-wrapper { justify-content: flex-end; }
    .other-message-wrapper { justify-content: flex-start; }

    .message-bubble {
        max-width: 70%;
        padding: 10px 16px;
        border-radius: 18px;
        position: relative;
        box-shadow: 0 2px 5px rgba(0,0,0,0.05);
    }

    .my-message-wrapper .message-bubble {
        background-color: #667eea;
        color: white;
        border-bottom-right-radius: 4px;
    }

    .other-message-wrapper .message-bubble {
        background-color: white;
        color: #333;
        border-bottom-left-radius: 4px;
    }

    .meta { font-size: 0.75rem; color: #666; margin-bottom: 2px; font-weight: 600; }
    .timestamp { 
        font-size: 0.7rem; 
        margin-top: 4px; 
        text-align: right;
        opacity: 0.7;
    }
    .my-message-wrapper .timestamp { color: #e0e0e0; }

    /* Footer Input */
    .chat-input-area {
      background: white;
      padding: 1rem 1.5rem;
      border-top: 1px solid #e6e6e6;
      display: flex;
      gap: 1rem;
    }

    .message-input {
      flex-grow: 1;
      padding: 12px 16px;
      border: 1px solid #ddd;
      border-radius: 24px;
      font-size: 0.95rem;
      outline: none;
      transition: border-color 0.2s;
    }
    .message-input:focus { border-color: #667eea; }

    .btn-send {
      padding: 0 24px;
      background: #667eea;
      color: white;
      border: none;
      border-radius: 24px;
      font-weight: 600;
      cursor: pointer;
    }
    .btn-send:disabled { background: #ccc; cursor: default; }
  `]
})
export class ChatComponent implements OnInit, AfterViewChecked, OnDestroy {
  messages: any[] = [];
  newMessage = '';
  currentUser = '';
  private wsSubscription: Subscription | undefined;
  @ViewChild('scrollContainer') private scrollContainer!: ElementRef;

  constructor(private messageService: MessageService, private router: Router) { }

  ngOnInit() {
    this.currentUser = sessionStorage.getItem('chatUser') || '';
    if (!this.currentUser) {
      this.router.navigate(['/login']);
      return;
    }

    // Initial Load
    this.loadMessages();

    // Connect to WebSocket
    this.messageService.connect();

    // Subscribe to real-time updates
    this.wsSubscription = this.messageService.messages$.subscribe(msg => {
      // Prevent duplicate if we just sent it (though usually good to rely on ID)
      // For POC simplicity, just append. If we implement ID check later, better.
      // Actually, loadMessages fetches all. Real-time appends new one.
      // To avoid duplicates if the POST returns the message and we add it there:
      // In sendMessage, we reloadMessages() currently. We should change that.

      // Simple dedupe by ID if exists
      if (!this.messages.some(m => m.id === msg.id)) {
        this.messages.push(msg);
        // Force change detection if needed, but Angular handles array push usually.
      }
    });
  }

  ngAfterViewChecked() {
    this.scrollToBottom();
  }

  ngOnDestroy() {
    if (this.wsSubscription) {
      this.wsSubscription.unsubscribe();
    }
    this.messageService.disconnect();
  }

  scrollToBottom(): void {
    try {
      this.scrollContainer.nativeElement.scrollTop = this.scrollContainer.nativeElement.scrollHeight;
    } catch (err) { }
  }

  loadMessages() {
    this.messageService.getMessages().subscribe({
      next: (data) => this.messages = data,
      error: () => this.router.navigate(['/login'])
    });
  }

  sendMessage() {
    if (!this.newMessage.trim()) return;
    this.messageService.postMessage(this.newMessage).subscribe(() => {
      // For optimizing: we could just wait for the websocket to echo it back!
      // But to be sure, we can clear input.
      this.newMessage = '';

      // DO NOT call loadMessages() here anymore, relying on WebSocket to reflect our own message back
      // The backend broadcast sends it to everyone including us.
    });
  }

  logout() {
    sessionStorage.clear();
    this.router.navigate(['/login']);
  }
}
