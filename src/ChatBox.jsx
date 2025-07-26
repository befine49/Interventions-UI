
function ChatBox(){

    return(
        <div className="ChatBox">
            <div className="top">
                <h3>Technicien Diop</h3>
                <button className="Close">Close 
                    <span class="material-symbols-outlined">
                    close
                    </span>
                </button>
            </div>
            <div className="Chat-display">

            </div>
            <div className="chat-sendes">
                <input type="text" className="chat-send" placeholder="Ask anything"/>
                <button className="btn-send">
                    <span class="material-symbols-outlined">
                    arrow_upward_alt
                    </span>
                </button>
            </div>
            
        </div>
    );
}
export default ChatBox