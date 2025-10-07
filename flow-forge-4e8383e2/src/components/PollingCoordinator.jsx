/**
 * PollingCoordinator: Coordinate polling across browser tabs
 * 
 * APPROACH: Use BroadcastChannel + localStorage mutex
 * 
 * LIMITATIONS:
 * - Only works within same browser on same device
 * - Does not coordinate across users or devices
 * - Does not prevent backend race conditions
 * 
 * RESIDUAL RISKS:
 * - Two users can still process same run simultaneously
 * - Network partition can cause split-brain
 * - localStorage can be cleared mid-execution
 */

class PollingCoordinator {
  constructor() {
    this.tabId = crypto.randomUUID();
    this.lockKey = 'dchor_polling_lock';
    this.channel = null;
    this.isLeader = false;
    this.heartbeatInterval = null;
    
    // Try to use BroadcastChannel (not supported in all browsers)
    if (typeof BroadcastChannel !== 'undefined') {
      this.channel = new BroadcastChannel('dchor_polling');
      this.setupChannelListeners();
    } else {
      // Fallback: Use storage events
      window.addEventListener('storage', this.handleStorageEvent.bind(this));
    }
    
    // Start leader election
    this.electLeader();
  }
  
  // =========================================================================
  // LEADER ELECTION
  // =========================================================================
  
  electLeader() {
    const lock = this.getLock();
    
    if (!lock || Date.now() - lock.timestamp > 30000) {
      // No leader or leader expired, become leader
      this.becomeLeader();
    } else if (lock.tabId === this.tabId) {
      // We're already leader
      this.isLeader = true;
      this.startHeartbeat();
    } else {
      // Someone else is leader
      this.isLeader = false;
      
      // Check again in 10 seconds
      setTimeout(() => this.electLeader(), 10000);
    }
  }
  
  becomeLeader() {
    this.isLeader = true;
    this.setLock();
    this.startHeartbeat();
    
    console.log(`[Tab ${this.tabId.slice(0, 8)}] Became polling leader`);
    
    // Announce leadership
    this.broadcast({ type: 'LEADER_ELECTED', tabId: this.tabId });
  }
  
  setLock() {
    localStorage.setItem(this.lockKey, JSON.stringify({
      tabId: this.tabId,
      timestamp: Date.now()
    }));
  }
  
  getLock() {
    try {
      const data = localStorage.getItem(this.lockKey);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  }
  
  releaseLock() {
    const lock = this.getLock();
    if (lock && lock.tabId === this.tabId) {
      localStorage.removeItem(this.lockKey);
    }
  }
  
  // =========================================================================
  // HEARTBEAT (Maintain Leadership)
  // =========================================================================
  
  startHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }
    
    this.heartbeatInterval = setInterval(() => {
      if (this.isLeader) {
        this.setLock(); // Refresh lock timestamp
      }
    }, 10000); // Every 10 seconds
  }
  
  stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }
  
  // =========================================================================
  // CROSS-TAB COMMUNICATION
  // =========================================================================
  
  setupChannelListeners() {
    this.channel.onmessage = (event) => {
      const { type, tabId, data } = event.data;
      
      switch (type) {
        case 'LEADER_ELECTED':
          if (tabId !== this.tabId) {
            // Someone else became leader, step down
            this.isLeader = false;
            this.stopHeartbeat();
          }
          break;
          
        case 'POLL_STARTED':
          if (this.isLeader && tabId !== this.tabId) {
            // Another tab is trying to poll, remind them we're leader
            this.broadcast({ type: 'LEADER_ALIVE', tabId: this.tabId });
          }
          break;
          
        case 'LEADER_ALIVE':
          if (this.isLeader && tabId !== this.tabId) {
            // Conflict! Another tab claims leadership
            // Resolve by tab ID (deterministic)
            if (tabId < this.tabId) {
              console.log('Stepping down due to leader conflict');
              this.isLeader = false;
              this.stopHeartbeat();
              this.releaseLock();
            }
          }
          break;
      }
    };
  }
  
  handleStorageEvent(event) {
    if (event.key === this.lockKey) {
      // Lock changed, re-evaluate leadership
      this.electLeader();
    }
  }
  
  broadcast(message) {
    if (this.channel) {
      this.channel.postMessage(message);
    } else {
      // Fallback: Use localStorage events
      localStorage.setItem('dchor_message', JSON.stringify({
        ...message,
        timestamp: Date.now()
      }));
    }
  }
  
  // =========================================================================
  // PUBLIC API
  // =========================================================================
  
  canPoll() {
    return this.isLeader;
  }
  
  notifyPollStarted() {
    this.broadcast({ type: 'POLL_STARTED', tabId: this.tabId });
  }
  
  shutdown() {
    this.stopHeartbeat();
    this.releaseLock();
    
    if (this.channel) {
      this.channel.close();
    }
    
    window.removeEventListener('storage', this.handleStorageEvent);
  }
}

// Global singleton
let coordinator = null;

export function getPollingCoordinator() {
  if (!coordinator) {
    coordinator = new PollingCoordinator();
    
    // Cleanup on page unload
    window.addEventListener('beforeunload', () => {
      if (coordinator) {
        coordinator.shutdown();
      }
    });
  }
  
  return coordinator;
}

export default PollingCoordinator;