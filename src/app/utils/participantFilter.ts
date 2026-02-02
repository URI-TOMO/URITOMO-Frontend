
/**
 * Interface representing a participant or member.
 * Compatible with LiveKit Participant options and local member types.
 */
interface ParticipantLike {
    identity?: string;
    name?: string;
    displayName?: string;
    id?: string;
}

/**
 * Checks if a participant should be hidden from the UI.
 * Target: "worker:livekit_worker", "LiveKit Worker", or anyone with "worker" or "livekit" in their identity/name.
 * 
 * @param participant The participant object to check
 * @returns true if the participant should be hidden, false otherwise
 */
export const isHiddenParticipant = (participant: ParticipantLike): boolean => {
    if (!participant) return false;

    const identity = participant.identity || participant.id || '';
    const name = participant.name || participant.displayName || '';

    // Combine all fields to check
    const searchString = `${identity} ${name}`.toLowerCase();

    // Keywords to filter out
    const hiddenKeywords = ['worker', 'livekit'];

    return hiddenKeywords.some(keyword => searchString.includes(keyword));
};
