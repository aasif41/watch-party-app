import React from "react";
import ReactPlayer from "react-player";

const VideoPlayer = ({ url, playing, onPlay, onPause, playerRef }) => {
  return (
    <div className="video-wrapper" style={{ width: '100%', height: '450px', backgroundColor: '#000', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 4px 15px rgba(0,0,0,0.2)' }}>
      <ReactPlayer
        ref={playerRef}
        url={url}
        playing={playing}
        controls={true}
        width="100%"
        height="100%"
        onPlay={onPlay}
        onPause={onPause}
      />
    </div>
  );
};

export default VideoPlayer;