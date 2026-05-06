import { Component, OnInit, OnDestroy, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { SocketService } from '../../core/services/socket.service';

@Component({
  selector: 'app-inbox',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './inbox.component.html',
  styleUrls: ['./inbox.component.css']
})
export class InboxComponent implements OnInit, OnDestroy {
  @ViewChild('scrollMe') private myScrollContainer!: ElementRef;

  conversations: any[] = [];
  selectedConvo: any = null;
  messages: any[] = [];
  newMessage = '';
  loadingConvos = false;
  loadingMessages = false;
  currentUser: any = null;
  currentChannel: string = '';

  constructor(
    private api: ApiService,
    private socket: SocketService
  ) {}

  ngOnInit() {
    this.currentUser = JSON.parse(localStorage.getItem('uc_user') || '{}');
    this.loadConversations();
    this.setupSocketListeners();
  }

  ngOnDestroy() {
    // Unsubscribe from socket if needed
  }

  setupSocketListeners() {
    if (this.currentUser?.businessId) {
      this.socket.joinBusiness(this.currentUser.businessId);
      
      this.socket.on('new_message').subscribe((data: any) => {
        const convo = this.conversations.find(c => c.id === data.conversationId);
        if (convo) {
          convo.last_message = data.message.content;
          convo.last_message_at = data.message.created_at;
          // Move to top
          this.conversations = [convo, ...this.conversations.filter(c => c.id !== convo.id)];
        } else {
          // If a filter is applied, only load if it matches
          if (!this.currentChannel) {
             this.loadConversations();
          }
        }

        if (this.selectedConvo?.id === data.conversationId) {
          this.messages.push(data.message);
          this.scrollToBottom();
        }
      });
    }
  }

  filterByChannel(channel: string) {
    this.currentChannel = channel;
    this.selectedConvo = null; // Reset selection
    this.messages = [];
    this.loadConversations();
  }

  loadConversations() {
    this.loadingConvos = true;
    const url = this.currentChannel ? `/conversations?channel=${this.currentChannel}` : '/conversations';
    this.api.get(url).subscribe({
      next: (res: any) => {
        this.conversations = res.data;
        this.loadingConvos = false;
        if (this.conversations.length > 0 && !this.selectedConvo) {
          this.selectConversation(this.conversations[0]);
        }
      },
      error: () => this.loadingConvos = false
    });
  }

  selectConversation(convo: any) {
    this.selectedConvo = convo;
    this.loadMessages(convo.id);
  }

  loadMessages(convoId: number) {
    this.loadingMessages = true;
    this.api.get(`/conversations/${convoId}/messages`).subscribe({
      next: (res: any) => {
        this.messages = res.data;
        this.loadingMessages = false;
        this.scrollToBottom();
      },
      error: () => this.loadingMessages = false
    });
  }

  sendMessage() {
    if (!this.newMessage.trim() || !this.selectedConvo) return;

    const content = this.newMessage;
    this.newMessage = '';

    this.api.post(`/conversations/${this.selectedConvo.id}/messages`, { content }).subscribe({
      next: (res: any) => {
        if (res.success) {
          // Message will likely come back via socket too, but we can optimistically add it
          // Or wait for the API response
          if (!this.messages.find(m => m.id === res.data.id)) {
            this.messages.push(res.data);
            this.scrollToBottom();
          }
          // Update last message in sidebar
          const convo = this.conversations.find(c => c.id === this.selectedConvo.id);
          if (convo) convo.last_message = content;
        }
      },
      error: (err) => {
        alert('Failed to send: ' + (err.error?.message || 'Error'));
      }
    });
  }

  updateStatus(status: string) {
    if (!this.selectedConvo) return;
    this.api.patch(`/conversations/${this.selectedConvo.id}/status`, { status }).subscribe({
      next: () => {
        this.selectedConvo.status = status;
        if (status === 'resolved') {
          this.loadConversations();
        }
      }
    });
  }

  private scrollToBottom(): void {
    setTimeout(() => {
      try {
        this.myScrollContainer.nativeElement.scrollTop = this.myScrollContainer.nativeElement.scrollHeight;
      } catch(err) { }
    }, 100);
  }
}
