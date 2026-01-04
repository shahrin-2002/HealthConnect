/**
 * Video Call Modal Component
 * Shared component for doctor and patient video calls
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import socketService from '../services/socket';
import webrtcService from '../services/webrtc';
import './VideoCallModal.css';

export default function VideoCallModal({
  isOpen,
  onClose,
  appointmentId,
  remoteUserId,
  remoteUserName,
  isInitiator // true for doctor, false for patient
}) {
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const [connectionState, setConnectionState] = useState('connecting');
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [error, setError] = useState('');

  const handleEndCall = useCallback(() => {
    socketService.endCall(appointmentId);
    webrtcService.cleanup();
    onClose();
  }, [appointmentId, onClose]);

  useEffect(() => {
    if (!isOpen) return;

    let mounted = true;

    const startCall = async () => {
      try {
        setError('');
        setConnectionState('connecting');

        // Initialize WebRTC and get streams
        const { localStream, remoteStream } = await webrtcService.initialize();

        if (!mounted) {
          webrtcService.cleanup();
          return;
        }

        // Set video elements
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = localStream;
        }
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = remoteStream;
        }

        // Handle ICE candidates - send to remote peer
        webrtcService.onIceCandidate((candidate) => {
          socketService.sendIceCandidate(remoteUserId, candidate);
        });

        // Handle connection state changes
        webrtcService.onConnectionStateChange((state) => {
          console.log('[VideoCall] Connection state:', state);
          setConnectionState(state);
          if (state === 'disconnected' || state === 'failed') {
            handleEndCall();
          }
        });

        // Listen for ICE candidates from remote peer
        socketService.onIceCandidate(({ candidate }) => {
          webrtcService.addIceCandidate(candidate);
        });

        // Listen for call ended by other party
        socketService.onCallEnded(() => {
          if (mounted) {
            webrtcService.cleanup();
            onClose();
          }
        });

        if (isInitiator) {
          // Doctor: Create and send offer
          const offer = await webrtcService.createOffer();
          socketService.sendOffer(remoteUserId, offer);

          // Wait for answer from patient
          socketService.onWebRTCAnswer(async ({ answer }) => {
            await webrtcService.handleAnswer(answer);
          });
        } else {
          // Patient: Wait for offer from doctor
          socketService.onWebRTCOffer(async ({ offer }) => {
            const answer = await webrtcService.handleOffer(offer);
            socketService.sendAnswer(remoteUserId, answer);
          });
        }
      } catch (err) {
        console.error('[VideoCall] Error:', err);
        if (mounted) {
          setError(err.message || 'Failed to start video call');
          setConnectionState('failed');
        }
      }
    };

    startCall();

    return () => {
      mounted = false;
      // Clean up socket listeners
      socketService.off('webrtc:offer');
      socketService.off('webrtc:answer');
      socketService.off('webrtc:ice-candidate');
      socketService.off('call:ended');
      webrtcService.cleanup();
    };
  }, [isOpen, remoteUserId, isInitiator, onClose, handleEndCall]);

  const toggleAudio = () => {
    const newState = !audioEnabled;
    setAudioEnabled(newState);
    webrtcService.toggleAudio(newState);
  };

  const toggleVideo = () => {
    const newState = !videoEnabled;
    setVideoEnabled(newState);
    webrtcService.toggleVideo(newState);
  };

  if (!isOpen) return null;

  const getStatusText = () => {
    switch (connectionState) {
      case 'connecting':
        return 'Connecting...';
      case 'connected':
        return `In call with ${remoteUserName}`;
      case 'disconnected':
        return 'Disconnected';
      case 'failed':
        return 'Connection failed';
      default:
        return connectionState;
    }
  };

  return (
    <div className="video-call-overlay">
      <div className="video-call-modal">
        <div className="video-container">
          {/* Remote video (large) */}
          <video
            ref={remoteVideoRef}
            className="remote-video"
            autoPlay
            playsInline
          />

          {/* Local video (picture-in-picture) */}
          <video
            ref={localVideoRef}
            className="local-video"
            autoPlay
            playsInline
            muted
          />

          {/* Connection status */}
          <div className={`connection-status ${connectionState}`}>
            {getStatusText()}
          </div>

          {/* Error message */}
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}
        </div>

        {/* Call controls */}
        <div className="call-controls">
          <button
            className={`control-btn ${!audioEnabled ? 'disabled' : ''}`}
            onClick={toggleAudio}
            title={audioEnabled ? 'Mute' : 'Unmute'}
          >
            {audioEnabled ? 'Mute' : 'Unmute'}
          </button>

          <button
            className={`control-btn ${!videoEnabled ? 'disabled' : ''}`}
            onClick={toggleVideo}
            title={videoEnabled ? 'Hide Video' : 'Show Video'}
          >
            {videoEnabled ? 'Hide Video' : 'Show Video'}
          </button>

          <button
            className="control-btn end-call"
            onClick={handleEndCall}
            title="End Call"
          >
            End Call
          </button>
        </div>
      </div>
    </div>
  );
}
