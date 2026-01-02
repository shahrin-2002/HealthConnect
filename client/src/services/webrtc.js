/**
 * WebRTC Service
 * Handles peer-to-peer video/audio connections
 */

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' }
  ]
};

class WebRTCService {
  peerConnection = null;
  localStream = null;
  remoteStream = null;
  onIceCandidateCallback = null;
  onConnectionStateChangeCallback = null;

  /**
   * Initialize WebRTC connection and get local media stream
   * @returns {Promise<{localStream: MediaStream, remoteStream: MediaStream}>}
   */
  async initialize() {
    try {
      // Get local media stream
      this.localStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });

      // Create peer connection
      this.peerConnection = new RTCPeerConnection(ICE_SERVERS);

      // Add local tracks to connection
      this.localStream.getTracks().forEach((track) => {
        this.peerConnection.addTrack(track, this.localStream);
      });

      // Create remote stream to receive tracks
      this.remoteStream = new MediaStream();

      // Handle incoming tracks from remote peer
      this.peerConnection.ontrack = (event) => {
        event.streams[0].getTracks().forEach((track) => {
          this.remoteStream.addTrack(track);
        });
      };

      // Handle ICE candidates
      this.peerConnection.onicecandidate = (event) => {
        if (event.candidate && this.onIceCandidateCallback) {
          this.onIceCandidateCallback(event.candidate);
        }
      };

      // Handle connection state changes
      this.peerConnection.onconnectionstatechange = () => {
        if (this.onConnectionStateChangeCallback) {
          this.onConnectionStateChangeCallback(this.peerConnection.connectionState);
        }
      };

      return {
        localStream: this.localStream,
        remoteStream: this.remoteStream
      };
    } catch (error) {
      console.error('[WebRTC] Initialize error:', error);
      throw error;
    }
  }

  /**
   * Create SDP offer (called by initiator/doctor)
   * @returns {Promise<RTCSessionDescriptionInit>}
   */
  async createOffer() {
    const offer = await this.peerConnection.createOffer();
    await this.peerConnection.setLocalDescription(offer);
    return offer;
  }

  /**
   * Handle incoming SDP offer and create answer (called by receiver/patient)
   * @param {RTCSessionDescriptionInit} offer
   * @returns {Promise<RTCSessionDescriptionInit>}
   */
  async handleOffer(offer) {
    await this.peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
    const answer = await this.peerConnection.createAnswer();
    await this.peerConnection.setLocalDescription(answer);
    return answer;
  }

  /**
   * Handle incoming SDP answer (called by initiator/doctor)
   * @param {RTCSessionDescriptionInit} answer
   */
  async handleAnswer(answer) {
    await this.peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
  }

  /**
   * Add ICE candidate from remote peer
   * @param {RTCIceCandidateInit} candidate
   */
  async addIceCandidate(candidate) {
    if (candidate && this.peerConnection) {
      try {
        await this.peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (error) {
        console.error('[WebRTC] Add ICE candidate error:', error);
      }
    }
  }

  /**
   * Set callback for ICE candidates
   * @param {Function} callback
   */
  onIceCandidate(callback) {
    this.onIceCandidateCallback = callback;
  }

  /**
   * Set callback for connection state changes
   * @param {Function} callback
   */
  onConnectionStateChange(callback) {
    this.onConnectionStateChangeCallback = callback;
  }

  /**
   * Toggle audio (mute/unmute)
   * @param {boolean} enabled
   */
  toggleAudio(enabled) {
    if (this.localStream) {
      this.localStream.getAudioTracks().forEach((track) => {
        track.enabled = enabled;
      });
    }
  }

  /**
   * Toggle video (show/hide)
   * @param {boolean} enabled
   */
  toggleVideo(enabled) {
    if (this.localStream) {
      this.localStream.getVideoTracks().forEach((track) => {
        track.enabled = enabled;
      });
    }
  }

  /**
   * Get current connection state
   * @returns {RTCPeerConnectionState|null}
   */
  getConnectionState() {
    return this.peerConnection?.connectionState || null;
  }

  /**
   * Clean up all resources
   */
  cleanup() {
    // Stop all local tracks
    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => track.stop());
      this.localStream = null;
    }

    // Close peer connection
    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null;
    }

    this.remoteStream = null;
    this.onIceCandidateCallback = null;
    this.onConnectionStateChangeCallback = null;
  }
}

// Export singleton instance
const webrtcService = new WebRTCService();
export default webrtcService;
