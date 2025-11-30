// Event types for inter-service communication

export interface DomainEvent {
  eventType: string;
  timestamp: Date;
  payload: unknown;
}

// User Events
export interface UserCreatedEvent extends DomainEvent {
  eventType: 'user.created';
  payload: {
    userId: string;
    email: string;
    role: string;
  };
}

// Recitation Events
export interface RecitationCreatedEvent extends DomainEvent {
  eventType: 'recitation.created';
  payload: {
    recitationId: string;
    userId: string;
    surah: string;
  };
}

export interface RecitationUploadedEvent extends DomainEvent {
  eventType: 'recitation.uploaded';
  payload: {
    recitationId: string;
    audioUrl: string;
    metadata?: {
      surah?: string;
      verses?: string;
    };
  };
}

export interface RecitationPublishedEvent extends DomainEvent {
  eventType: 'recitation.published';
  payload: {
    recitationId: string;
    userId: string;
  };
}

// Audio Processing Events
export interface AudioAnalysisCompletedEvent extends DomainEvent {
  eventType: 'audio.analysis.completed';
  payload: {
    recitationId: string;
    duration: number;
    quality: string;
    deepfakeScore: number;
  };
}

export interface DeepfakeDetectedEvent extends DomainEvent {
  eventType: 'audio.deepfake.detected';
  payload: {
    recitationId: string;
    deepfakeScore: number;
  };
}

// Moderation Events
export interface ModerationCompletedEvent extends DomainEvent {
  eventType: 'moderation.completed';
  payload: {
    recitationId: string;
    decision: string;
    reason?: string;
    kidsSafe: boolean;
  };
}

export interface ContentFlaggedEvent extends DomainEvent {
  eventType: 'moderation.flagged';
  payload: {
    recitationId: string;
    reason: string;
  };
}

// Engagement Events
export interface RecitationLikedEvent extends DomainEvent {
  eventType: 'engagement.liked';
  payload: {
    recitationId: string;
    userId: string;
  };
}

export interface CommentAddedEvent extends DomainEvent {
  eventType: 'engagement.commented';
  payload: {
    recitationId: string;
    userId: string;
    commentId: string;
  };
}
