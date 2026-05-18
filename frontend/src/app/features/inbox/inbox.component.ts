import { Component, OnInit, OnDestroy, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
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
  searchQuery = '';
  showChannelFilter = false;
  showHeaderMenu = false;

  // Product Picker
  showProductPicker = false;
  products: any[] = [];
  loadingProducts = false;
  productSearch = '';

  // Quick Actions & Input Extras
  showEmojiPicker = false;
  agents: any[] = [];
  emojis = ['😀', '😃', '😄', '😁', '😅', '😂', '🤣', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚', '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🤩', '🥳', '😏', '😒', '😞', '😔', '😟', '😕', '🙁', '☹️', '😮', '😯', '😲', '😳', '🥺', '😦', '😧', '😨', '😰', '😥', '😢', '😭', '😱', '😖', '😣', '😞', '😓', '😩', '😫', '🥱', '😤', '😡', '😠', '🤬', '😈', '👿', '💀', '☠️', '💩', '🤡', '👹', '👺', '👻', '👽', '👾', '🤖', '😺', '😸', '😹', '😻', '😼', '😽', '🙀', '😿', '😾', '🙈', '🙉', '🙊', '💋', '💌', '💘', '💝', '💖', '💗', '💓', '💞', '💕', '💟', '❣️', '💔', '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💯', '💢', '💥', '💫', '💦', '💨', '🕳️', '💣', '💬', '👁️‍🗨️', '🗨️', '🗯️', '💭', '💤'];

  constructor(
    private api: ApiService,
    private socket: SocketService,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    this.currentUser = JSON.parse(localStorage.getItem('uc_user') || '{}');
    
    this.route.queryParams.subscribe(params => {
      const convoId = params['convoId'];
      if (convoId) {
        this.loadConversations(Number(convoId));
      } else {
        this.loadConversations();
      }
    });

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

  onSearch() {
    this.loadConversations();
  }

  loadConversations(convoIdToSelect?: number) {
    this.loadingConvos = true;
    const params: any = {};
    if (this.currentChannel) params.channel = this.currentChannel;
    if (this.searchQuery) params.search = this.searchQuery;

    this.api.get('/conversations', params).subscribe({
      next: (res: any) => {
        this.conversations = res.data;
        this.loadingConvos = false;
        
        if (convoIdToSelect) {
          const convo = this.conversations.find(c => c.id === convoIdToSelect);
          if (convo) {
            this.selectConversation(convo);
          } else if (this.conversations.length > 0 && !this.selectedConvo) {
            this.selectConversation(this.conversations[0]);
          }
        } else if (this.conversations.length > 0 && !this.selectedConvo) {
          this.selectConversation(this.conversations[0]);
        }
      },
      error: (err) => {
        this.loadingConvos = false;
        console.error('Failed to load conversations', err);
        // We don't alert here if it's a 401 because the interceptor handles it
        if (err.status !== 401) {
          alert('Failed to load conversations: ' + (err.error?.message || 'Server error'));
        }
      }
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
          // Show a small toast or just reload
          this.loadConversations();
        }
      }
    });
  }

  assignToMe() {
    if (!this.selectedConvo || !this.currentUser?.id) {
      console.warn('Cannot assign: Selected convo or current user ID missing', {convo: this.selectedConvo, user: this.currentUser});
      return;
    }
    this.api.patch(`/conversations/${this.selectedConvo.id}/assign`, { agent_id: this.currentUser.id }).subscribe({
      next: () => {
        this.selectedConvo.assigned_to = this.currentUser.id;
        this.selectedConvo.assigned_name = this.currentUser.name;
        alert('Conversation assigned to you');
      },
      error: (err) => alert('Failed to assign: ' + (err.error?.message || 'Error'))
    });
  }

  openProductPicker() {
    this.showProductPicker = true;
    this.productSearch = '';
    this.loadProducts();
  }

  loadProducts() {
    this.loadingProducts = true;
    this.api.get('/ecommerce/products').subscribe({
      next: (res: any) => {
        this.products = res.data || [];
        this.loadingProducts = false;
      },
      error: () => this.loadingProducts = false
    });
  }

  get filteredProducts() {
    if (!this.productSearch.trim()) return this.products;
    const q = this.productSearch.toLowerCase();
    return this.products.filter((p: any) =>
      p.name?.toLowerCase().includes(q) || p.sku?.toLowerCase().includes(q)
    );
  }

  sendProduct(product: any) {
    if (!this.selectedConvo) return;

    const content = `🛍️ *${product.name}*\n\n${product.description || ''}\n\n💰 Price: ₹${product.price}\n📦 SKU: ${product.sku || 'N/A'}\n✅ In Stock: ${product.stock > 0 ? 'Yes' : 'Out of Stock'}`;

    this.api.post(`/conversations/${this.selectedConvo.id}/messages`, { content }).subscribe({
      next: (res: any) => {
        if (res.success) {
          if (!this.messages.find(m => m.id === res.data.id)) {
            this.messages.push(res.data);
            this.scrollToBottom();
          }
          const convo = this.conversations.find(c => c.id === this.selectedConvo.id);
          if (convo) convo.last_message = `🛍️ ${product.name}`;
        }
      },
      error: (err) => alert('Failed to send product: ' + (err.error?.message || 'Error'))
    });

    this.showProductPicker = false;
  }

  // Quick Actions
  editContact() {
    if (!this.selectedConvo) return;
    const newName = window.prompt('Enter new name for contact:', this.selectedConvo.contact_name);
    if (newName && newName !== this.selectedConvo.contact_name) {
      this.api.put(`/contacts/${this.selectedConvo.contact_id}`, { name: newName }).subscribe({
        next: () => {
          this.selectedConvo.contact_name = newName;
          const convo = this.conversations.find(c => c.id === this.selectedConvo.id);
          if (convo) convo.contact_name = newName;
        },
        error: (err) => alert('Failed to update contact: ' + (err.error?.message || 'Error'))
      });
    }
  }

  addTag() {
    if (!this.selectedConvo) return;
    const tag = window.prompt('Enter tag name:');
    if (tag) {
      // Get current tags or empty array
      let tags = [];
      try {
        tags = typeof this.selectedConvo.tags === 'string' ? JSON.parse(this.selectedConvo.tags) : (this.selectedConvo.tags || []);
      } catch(e) { tags = []; }
      
      if (!tags.includes(tag)) {
        tags.push(tag);
        this.api.put(`/contacts/${this.selectedConvo.contact_id}`, { tags: JSON.stringify(tags) }).subscribe({
          next: () => {
            this.selectedConvo.tags = tags;
            alert('Tag added successfully');
          },
          error: (err) => alert('Failed to add tag: ' + (err.error?.message || 'Error'))
        });
      }
    }
  }

  assignAgent() {
    if (!this.selectedConvo) return;
    this.api.get('/users?role=agent').subscribe({
      next: (res: any) => {
        const agents = res.data || [];
        if (agents.length === 0) {
          alert('No agents available');
          return;
        }
        let msg = 'Select an agent to assign:\n';
        agents.forEach((a: any, i: number) => msg += `${i+1}. ${a.name} (${a.email})\n`);
        const choice = window.prompt(msg);
        if (choice) {
          const idx = parseInt(choice) - 1;
          if (agents[idx]) {
            this.api.patch(`/conversations/${this.selectedConvo.id}/assign`, { agent_id: agents[idx].id }).subscribe({
              next: () => {
                this.selectedConvo.assigned_name = agents[idx].name;
                alert(`Assigned to ${agents[idx].name}`);
              },
              error: (err) => alert('Failed to assign: ' + (err.error?.message || 'Error'))
            });
          }
        }
      },
      error: (err) => alert('Failed to load agents: ' + (err.error?.message || 'Error'))
    });
  }

  blockContact() {
    if (!this.selectedConvo) return;
    if (confirm(`Are you sure you want to block ${this.selectedConvo.contact_name}?`)) {
      this.api.post(`/contacts/${this.selectedConvo.contact_id}/optout`, {}).subscribe({
        next: () => {
          this.selectedConvo.opted_in = 0;
          alert('Contact blocked successfully');
        },
        error: (err) => alert('Failed to block contact: ' + (err.error?.message || 'Error'))
      });
    }
  }

  unblockContact() {
    if (!this.selectedConvo) return;
    if (confirm(`Are you sure you want to unblock ${this.selectedConvo.contact_name}?`)) {
      this.api.post(`/contacts/${this.selectedConvo.contact_id}/optin`, { source: 'manual' }).subscribe({
        next: () => {
          this.selectedConvo.opted_in = 1;
          alert('Contact unblocked successfully');
        },
        error: (err) => alert('Failed to unblock contact: ' + (err.error?.message || 'Error'))
      });
    }
  }

  // Input Extras
  toggleEmojiPicker() {
    this.showEmojiPicker = !this.showEmojiPicker;
  }

  addEmoji(emoji: string) {
    this.newMessage += emoji;
    this.showEmojiPicker = false;
  }

  attachFile() {
    const input = document.createElement('input');
    input.type = 'file';
    input.onchange = (e: any) => {
      const file = e.target.files[0];
      if (file) {
        alert(`File selected: ${file.name}. (File upload logic would go here)`);
      }
    };
    input.click();
  }

  private scrollToBottom(): void {
    setTimeout(() => {
      try {
        this.myScrollContainer.nativeElement.scrollTop = this.myScrollContainer.nativeElement.scrollHeight;
      } catch(err) { }
    }, 100);
  }
}
