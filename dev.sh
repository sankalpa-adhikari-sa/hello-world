SESSION="open_ag"
SESSIONEXISTS=$(tmux list-sessions | grep $SESSION)

if [ "$SESSIONEXISTS" = "" ]
then
    tmux new-session -d -s $SESSION

    # 1. SETUP BORDER FORMAT (The Magic Fix)
    # We tell tmux: "If a custom title exists, use it. Otherwise, use the default."
    tmux set-option -t $SESSION pane-border-status top
    tmux set-option -t $SESSION pane-border-format "#{?@custom_title,#{@custom_title},#{pane_title}}"

    # tmux set-option -t $SESSION -g mouse on
    tmux rename-window -t $SESSION:0 'Main'

    # 2. SPLIT & SETUP
    tmux split-window -h -l 30% -t $SESSION:0
    tmux send-keys -t $SESSION:0.1 'bun dev' C-m

    tmux new-window -t $SESSION -n 'Studio'
    tmux send-keys -t $SESSION:1 'bun db:studio' C-m

    # 3. SET TITLES (Using the custom variable)
    # We use set-option -p (pane option) with our custom variable "@custom_title"
    tmux set-option -p -t $SESSION:0.1 @custom_title "Vite server"
    tmux set-option -p -t $SESSION:0.0 @custom_title "Terminal"

    # 4. FOCUS
    tmux select-pane -t $SESSION:0.0
    tmux select-window -t $SESSION:0
fi

tmux attach-session -t $SESSION

# Naviage to main window ----> ctrl + b 0
# Cycle between  panes  ---> ctrl + b  left/right keys
# Navigate to Studio window ----> ctrl + b 1
# Close all tmux session ---->    tmux kill-session
#
# list all tmux active session ----> tmux ls
# Attach to specific session eg:open_ag  ----> tmux attach -t open_ag
# Close specific tmux session eg:open_ag ----> tmux kill-session -t open_ag
# Close a pane ---->   ctrl + b x
