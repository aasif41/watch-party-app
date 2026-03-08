import React from "react";
import ReactPlayer from "react-player";

const VideoPlayer = ({ url, playing, onPlay, onPause, playerRef }) => {
  return (
    <div style={{
      width: '100%',
      aspectRatio: '16/9',
      backgroundColor: '#000',
      borderRadius: '24px',
      overflow: 'hidden',
      border: '1px solid rgba(255, 255, 255, 0.05)',
      boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8), 0 0 30px rgba(124, 58, 237, 0.1)',
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