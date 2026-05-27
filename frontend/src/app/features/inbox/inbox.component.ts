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
  currentAssignment = 'all'; // 'all' or 'me'

  // Product Picker
  showProductPicker = false;
  products: any[] = [];
  loadingProducts = false;
  productSearch = '';

  // Quick Actions & Input Extras
  showEmojiPicker = false;
  showAgentPicker = false;
  loadingAgents = false;
  availableAgents: any[] = [];
  agents: any[] = [];

  // Custom Modal/Dialog States
  showEditContactModal = false;
  editContactName = '';
  showAddTagModal = false;
  newTagName = '';
  suggestedTags = ['VIP', 'Warm Lead', 'Cold Lead', 'Support', 'Customer', 'Follow Up', 'Prospect', 'Spam'];
  showConfirmModal = false;
  confirmTitle = '';
  confirmMessage = '';
  confirmType = 'danger'; // 'danger' | 'success' | 'primary'
  confirmActionCallback: () => void = () => {};

  // Toast notifications
  toasts: Array<{ id: number; message: string; type: 'success' | 'danger' | 'info' }> = [];
  private nextToastId = 0;

  showToast(message: string, type: 'success' | 'danger' | 'info' = 'success') {
    const id = this.nextToastId++;
    this.toasts.push({ id, message, type });
    setTimeout(() => {
      this.removeToast(id);
    }, 4000);
  }

  removeToast(id: number) {
    this.toasts = this.toasts.filter(t => t.id !== id);
  }

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

  filterByAssignment(type: string) {
    this.currentAssignment = type;
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
    if (this.currentAssignment === 'me') params.assigned_to = 'me';

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
          this.showToast('Failed to load conversations: ' + (err.error?.message || 'Server error'), 'danger');
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
        this.showToast('Failed to send: ' + (err.error?.message || 'Error'), 'danger');
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
        this.showToast('Conversation assigned to you successfully', 'success');
      },
      error: (err) => this.showToast('Failed to assign conversation: ' + (err.error?.message || 'Error'), 'danger')
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
      error: (err) => this.showToast('Failed to send product: ' + (err.error?.message || 'Error'), 'danger')
    });

    this.showProductPicker = false;
  }

  // Quick Actions
  editContact() {
    if (!this.selectedConvo) return;
    this.editContactName = this.selectedConvo.contact_name || '';
    this.showEditContactModal = true;
  }

  saveContactEdit() {
    if (!this.selectedConvo || !this.editContactName.trim()) return;
    const newName = this.editContactName.trim();
    this.api.put(`/contacts/${this.selectedConvo.contact_id}`, { name: newName }).subscribe({
      next: () => {
        this.selectedConvo.contact_name = newName;
        const convo = this.conversations.find(c => c.id === this.selectedConvo.id);
        if (convo) convo.contact_name = newName;
        this.showEditContactModal = false;
        this.showToast('Contact details updated successfully', 'success');
      },
      error: (err) => this.showToast('Failed to update contact: ' + (err.error?.message || 'Error'), 'danger')
    });
  }

  addTag() {
    if (!this.selectedConvo) return;
    this.newTagName = '';
    this.showAddTagModal = true;
  }

  saveTag() {
    if (!this.selectedConvo || !this.newTagName.trim()) return;
    const tag = this.newTagName.trim();
    let tags = [];
    try {
      tags = typeof this.selectedConvo.tags === 'string' ? JSON.parse(this.selectedConvo.tags) : (this.selectedConvo.tags || []);
    } catch(e) { tags = []; }
    
    if (!tags.includes(tag)) {
      tags.push(tag);
      this.api.put(`/contacts/${this.selectedConvo.contact_id}`, { tags: JSON.stringify(tags) }).subscribe({
        next: () => {
          this.selectedConvo.tags = tags;
          this.showAddTagModal = false;
          this.showToast('Tag added successfully', 'success');
        },
        error: (err) => this.showToast('Failed to add tag: ' + (err.error?.message || 'Error'), 'danger')
      });
    } else {
      this.showAddTagModal = false;
    }
  }

  parsedTags(convo: any): string[] {
    if (!convo || !convo.tags) return [];
    try {
      return typeof convo.tags === 'string' ? JSON.parse(convo.tags) : convo.tags;
    } catch (e) {
      return [];
    }
  }

  removeTagFromContact(tag: string) {
    if (!this.selectedConvo) return;
    let tags: string[] = [];
    try {
      tags = typeof this.selectedConvo.tags === 'string' ? JSON.parse(this.selectedConvo.tags) : (this.selectedConvo.tags || []);
    } catch(e) { tags = []; }
    
    tags = tags.filter(t => t !== tag);
    this.api.put(`/contacts/${this.selectedConvo.contact_id}`, { tags: JSON.stringify(tags) }).subscribe({
      next: () => {
        this.selectedConvo.tags = tags;
        this.showToast('Tag removed successfully', 'success');
      },
      error: (err) => this.showToast('Failed to remove tag: ' + (err.error?.message || 'Error'), 'danger')
    });
  }

  get availableTagsToSelect(): string[] {
    const tagsSet = new Set<string>(this.suggestedTags);
    this.conversations.forEach(convo => {
      if (convo.tags) {
        try {
          const parsed = typeof convo.tags === 'string' ? JSON.parse(convo.tags) : convo.tags;
          if (Array.isArray(parsed)) {
            parsed.forEach((tag: string) => {
              if (tag && tag.trim()) {
                tagsSet.add(tag.trim());
              }
            });
          }
        } catch (e) {
          // ignore parsing error
        }
      }
    });
    return Array.from(tagsSet);
  }

  assignAgent() {
    if (!this.selectedConvo) return;
    this.showAgentPicker = true;
    this.loadingAgents = true;
    this.availableAgents = [];
    this.api.get('/settings/team').subscribe({
      next: (res: any) => {
        const allUsers = res.data || [];
        // Filter to only include active team members who can be assigned (agents or admins)
        this.availableAgents = allUsers.filter((u: any) => u.is_active && (u.role === 'agent' || u.role === 'admin' || u.role === 'superadmin'));
        this.loadingAgents = false;
      },
      error: (err) => {
        this.loadingAgents = false;
        this.showAgentPicker = false;
        this.showToast('Failed to load agents: ' + (err.error?.message || 'Error'), 'danger');
      }
    });
  }

  selectAgentToAssign(agent: any) {
    if (!this.selectedConvo || !agent) return;
    this.api.patch(`/conversations/${this.selectedConvo.id}/assign`, { agent_id: agent.id }).subscribe({
      next: () => {
        this.selectedConvo.assigned_name = agent.name;
        this.showAgentPicker = false;
        this.showToast(`Assigned conversation to ${agent.name}`, 'success');
      },
      error: (err) => this.showToast('Failed to assign: ' + (err.error?.message || 'Error'), 'danger')
    });
  }

  blockContact() {
    if (!this.selectedConvo) return;
    this.confirmTitle = 'Block Contact';
    this.confirmMessage = `Are you sure you want to block ${this.selectedConvo.contact_name}? They will no longer receive automated notifications or broadcasts.`;
    this.confirmType = 'danger';
    this.confirmActionCallback = () => {
      this.api.post(`/contacts/${this.selectedConvo.contact_id}/optout`, {}).subscribe({
        next: () => {
          this.selectedConvo.opted_in = 0;
          this.showConfirmModal = false;
          this.showToast('Contact blocked successfully', 'success');
        },
        error: (err) => this.showToast('Failed to block contact: ' + (err.error?.message || 'Error'), 'danger')
      });
    };
    this.showConfirmModal = true;
  }

  deleteSelectedConversation() {
    if (!this.selectedConvo) return;
    this.confirmTitle = 'Delete Conversation';
    this.confirmMessage = `Are you sure you want to permanently delete the conversation with ${this.selectedConvo.contact_name || this.selectedConvo.contact_phone}? This will permanently delete all messages and cannot be undone.`;
    this.confirmType = 'danger';
    this.confirmActionCallback = () => {
      this.api.delete(`/conversations/${this.selectedConvo.id}`).subscribe({
        next: () => {
          this.conversations = this.conversations.filter(c => c.id !== this.selectedConvo.id);
          this.selectedConvo = null;
          this.messages = [];
          if (this.conversations.length > 0) {
            this.selectConversation(this.conversations[0]);
          }
          this.showConfirmModal = false;
          this.showToast('Conversation deleted successfully', 'success');
        },
        error: (err) => this.showToast('Failed to delete conversation: ' + (err.error?.message || 'Error'), 'danger')
      });
    };
    this.showConfirmModal = true;
  }

  unblockContact() {
    if (!this.selectedConvo) return;
    this.confirmTitle = 'Unblock Contact';
    this.confirmMessage = `Are you sure you want to unblock ${this.selectedConvo.contact_name}? They will be eligible to receive automated updates.`;
    this.confirmType = 'success';
    this.confirmActionCallback = () => {
      this.api.post(`/contacts/${this.selectedConvo.contact_id}/optin`, { source: 'manual' }).subscribe({
        next: () => {
          this.selectedConvo.opted_in = 1;
          this.showConfirmModal = false;
          this.showToast('Contact unblocked successfully', 'success');
        },
        error: (err) => this.showToast('Failed to unblock contact: ' + (err.error?.message || 'Error'), 'danger')
      });
    };
    this.showConfirmModal = true;
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
        this.showToast(`File selected: ${file.name}. Uploading feature is simulated.`, 'info');
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
