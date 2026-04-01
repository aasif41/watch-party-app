import React from "react";
import ReactPlayer from "react-player";

const VideoPlayer = ({ url, playing, onPlay, onPause, onProgress, onSeek, onBuffer, onBufferEnd, playerRef }) => {
  return (
    <div style={{
      width: '100%',
      aspectRatio: '16/9',
      backgroundColor: '#000',
      borderRadius: '12px',
      overflow: 'hidden',
      border: '1px solid rgba(255, 255, 255, 0.04)',
      position: 'relative'
    }}>
      <ReactPlayer
        ref={playerRef}
        url={url}
        playing={playing}
        controls={true}
        width="100%"
        height="100%"
        onPlay={onPlay}
        onPause={onPause}
        onProgress={onProgress}
        onSeek={onSeek}
        onBuffer={onBuffer}
        onBufferEnd={onBufferEnd}
        progressInterval={1000}
        config={{
          youtube: {
            playerVars: {
              origin: typeof window !== "undefined" ? window.location.origin : "https://watch-party-app-wsaq.vercel.app",
              enablejsapi: 1,
              rel: 0,
              modestbranding: 1
            }
          }
        }}
        style={{
          position: 'absolute',
          top: 0,
          left: 0
        }}
      />
    </div>
  );
};

export default VideoPlayer;