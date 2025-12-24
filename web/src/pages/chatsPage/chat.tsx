import { useState, useEffect, useRef, useCallback } from 'react';
import {
  AppBar,
  Toolbar,
  IconButton,
  Avatar,
  Typography,
  Box,
  TextField,
  InputAdornment,
  List,
  ListItem,
  ListItemAvatar,
  Paper,
  CircularProgress,
  Tooltip,
  Fab,
  Card,
  CardContent,
  useTheme,
  useMediaQuery,
  Fade,
  Slide,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  Send as SendIcon,
  AttachFile as AttachFileIcon,
  Mic as MicIcon,
  MoreVert as MoreVertIcon,
  Search as SearchIcon,
  ArrowBack as ArrowBackIcon,
  Reply as ReplyIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Check as CheckIcon,
  Refresh as RefreshIcon,
  Close as CloseIcon,
  KeyboardVoice as KeyboardVoiceIcon,
  InsertEmoticon as InsertEmoticonIcon,
} from '@mui/icons-material';
import { format, isToday, isYesterday, formatDistanceToNow } from 'date-fns';
import { useGetMessages } from "../../hooks/api/msg";
import { useSendMessage } from "../../hooks/api/msg";
import { useAuth } from '../../context/authContext';
import type { Message } from '../../types/msgTypes';
import { useGetChats } from '../../hooks/api/chat';
import type { Chat } from '../../types/chatTypes';

interface ChatParams {
  chatId: string;
  chat:Chat;
}

export const ChatBox = ({ chatId,chat }: ChatParams) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { user: currentUser } = useAuth();
  const [cursor, setCursor] = useState<string>("");
  const [limit] = useState(30);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [replyToMessage, setReplyToMessage] = useState<Message | null>(null);
  const [editMessage, setEditMessage] = useState<Message | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [messageToDelete, setMessageToDelete] = useState<Message | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  const { 
    data: messagesData, 
    isLoading, 
    error, 
    refetch 
  } = useGetMessages({ 
    chatId, 
    cursor, 
    limit 
  });
  
  const { 
    mutate: sendMessage, 
    isPending: isSending 
  } = useSendMessage();
  const messages: Message[] = messagesData?.messages || [];
  const nextCursor = messagesData?.nextCursor;
  
 
  // Scroll to bottom on new messages
  useEffect(() => {
    if (!showScrollButton) {
      scrollToBottom();
    }
  }, [messages]);

  const handleScroll = useCallback(() => {
    if (messagesContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
      setShowScrollButton(scrollHeight - scrollTop - clientHeight > 300);
      
      // Load more messages when near top
      if (scrollTop < 100 && nextCursor) {
        setCursor(nextCursor);
      }
    }
  }, [nextCursor]);

  useEffect(() => {
    const container = messagesContainerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, [handleScroll]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    setShowScrollButton(false);
  };

  const handleSendMessage = () => {
    if (!inputMessage.trim()) return;
  
    sendMessage({ params:{chatId}, data:{text:inputMessage} }, {
      onSuccess: (response) => {
        setInputMessage('');
        setReplyToMessage(null);
        setEditMessage(null);
        refetch();
      },
      onError: (error) => {
        console.error('Failed to send message:', error);
      }
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (timestamp: string) => {
    return format(new Date(timestamp), 'HH:mm');
  };

  const formatMessageTime = (timestamp: string) => {
    const messageDate = new Date(timestamp);
    
    if (isToday(messageDate)) {
      return format(messageDate, 'HH:mm');
    } else if (isYesterday(messageDate)) {
      return `Yesterday ${format(messageDate, 'HH:mm')}`;
    } else {
      return format(messageDate, 'dd/MM/yyyy HH:mm');
    }
  };

  const isOwnMessage = (message: Message) => {
    return currentUser && message.senderId === currentUser.id;
  };

  const handleReply = (message: Message) => {
    setReplyToMessage(message);
    setEditMessage(null);
    inputRef.current?.focus();
  };

  const handleEdit = (message: Message) => {
    setEditMessage(message);
    setReplyToMessage(null);
    setInputMessage(message.content);
    inputRef.current?.focus();
  };

  const handleDelete = (message: Message) => {
    setMessageToDelete(message);
    setDeleteDialogOpen(true);
  };

  const renderMessageContent = (message: Message) => {
    if (message.isDeleted) {
      return (
        <Typography 
          variant="body2" 
          sx={{ 
            fontStyle: 'italic',
            color: 'text.disabled'
          }}
        >
          Message deleted
        </Typography>
      );
    }

    return (
      <Box>
        {/* Reply Preview */}
        {message.replyToMessage && (
          <Paper
            elevation={0}
            sx={{
              p: 1,
              mb: 1,
              borderRadius: 1,
              bgcolor: 'action.hover',
              borderLeft: 3,
              borderColor: 'primary.main',
            }}
          >
            <Typography variant="caption" color="text.secondary" display="block">
              Replying to {message.replyToMessage.senderId === currentUser?.id ? 'yourself' : 'message'}
            </Typography>
            <Typography variant="body2" noWrap>
              {message.replyToMessage.isDeleted 
                ? 'Message deleted' 
                : message.replyToMessage.content}
            </Typography>
          </Paper>
        )}
        
        <Typography variant="body1" sx={{ wordBreak: 'break-word', whiteSpace: 'pre-wrap' }}>
          {message.content}
        </Typography>
        
        {/* Edited indicator */}
        {message.editedAt !== message.createdAt && !message.isDeleted && (
          <Typography variant="caption" sx={{ ml: 1, color: 'text.secondary' }}>
            (edited)
          </Typography>
        )}
      </Box>
    );
  };

  if (isLoading && !messages.length) {
    return (
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        height: '100vh',
        bgcolor: 'background.default'
      }}>
        <Box sx={{ textAlign: 'center' }}>
          <CircularProgress size={60} thickness={4} />
          <Typography variant="h6" sx={{ mt: 2, color: 'text.secondary' }}>
            Loading messages...
          </Typography>
        </Box>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        height: '100vh',
        bgcolor: 'background.default'
      }}>
        <Card sx={{ maxWidth: 400 }}>
          <CardContent sx={{ textAlign: 'center' }}>
            <Typography color="error" variant="h6" gutterBottom>
              Failed to load messages
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {error.message || 'Please try again later'}
            </Typography>
            <Button 
              variant="contained" 
              startIcon={<RefreshIcon />}
              onClick={() => refetch()}
            >
              Retry
            </Button>
          </CardContent>
        </Card>
      </Box>
    );
  }

  return (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: 'column', 
      height: '100vh',
      bgcolor: 'background.default'
    }}>
      {/* Chat Header */}
      <AppBar 
        position="static" 
        color="default" 
        elevation={1}
        sx={{ 
          bgcolor: 'grey.50',
          borderBottom: 1,
          borderColor: 'divider'
        }}
      >
        <Toolbar>
          {isMobile && (
            <IconButton edge="start" sx={{ mr: 2 }}>
              <ArrowBackIcon />
            </IconButton>
          )}
          
          <Box sx={{ display: 'flex', alignItems: 'center', flex: 1 }}>
            <Avatar 
              src={chat.groupPic}
              sx={{ width: 40, height: 40 }}
            >
              {chat.name.charAt(0)}
            </Avatar>
            
            <Box sx={{ ml: 2 }}>
              <Typography variant="h6" noWrap>
                {chat.name}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {isTyping ? 'typing...' : `${messages.length} messages`}
              </Typography>
            </Box>
          </Box>

          <Box sx={{ display: 'flex' }}>
            <Tooltip title="Search">
              <IconButton>
                <SearchIcon />
              </IconButton>
            </Tooltip>
            
            <Tooltip title="More options">
              <IconButton>
                <MoreVertIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Messages Area */}
      <Box
        ref={messagesContainerRef}
        sx={{
          flex: 1,
          overflowY: 'auto',
          p: { xs: 1, sm: 2 },
          bgcolor: 'grey.100',
          backgroundImage: 'url(/whatsapp-bg.png)',
          backgroundSize: 'cover',
          backgroundAttachment: 'fixed',
        }}
      >
        {nextCursor && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
            <Button 
              variant="text" 
              size="small"
              onClick={() => setCursor(nextCursor)}
              startIcon={<RefreshIcon />}
            >
              Load older messages
            </Button>
          </Box>
        )}

        <List sx={{ py: 0 }}>
          {messages.map((message) => {
            const ownMessage = isOwnMessage(message);
            
            return (
              <Fade in={true} key={message.id}>
                <ListItem
                  sx={{
                    justifyContent: ownMessage ? 'flex-end' : 'flex-start',
                    alignItems: 'flex-end',
                    py: 0.5,
                    px: 0,
                    position: 'relative',
                  }}
                >
                  {!ownMessage && (
                    <ListItemAvatar sx={{ minWidth: 40, alignSelf: 'flex-start' }}>
                      <Avatar 
                        src={message.sender.profilePic}
                        sx={{ width: 32, height: 32 }}
                      >
                        {message.sender.username.charAt(0)}
                      </Avatar>
                    </ListItemAvatar>
                  )}

                  <Box sx={{ 
                    maxWidth: { xs: '85%', sm: '70%' },
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: ownMessage ? 'flex-end' : 'flex-start'
                  }}>
                    {!ownMessage && (
                      <Typography 
                        variant="caption" 
                        color="text.secondary"
                        sx={{ ml: 1, mb: 0.5 }}
                      >
                        {message.sender.username}
                      </Typography>
                    )}
                    
                    <Paper
                      elevation={0}
                      sx={{
                        p: 1.5,
                        borderRadius: 3,
                        borderTopLeftRadius: ownMessage ? 18 : 0,
                        borderTopRightRadius: ownMessage ? 0 : 18,
                        bgcolor: ownMessage 
                          ? 'primary.light' 
                          : 'background.paper',
                        color: ownMessage 
                          ? 'primary.contrastText' 
                          : 'text.primary',
                        position: 'relative',
                        '&:hover .message-actions': {
                          opacity: 1,
                        }
                      }}
                    >
                      {/* Message Actions */}
                      {!message.isDeleted && (
                        <Box 
                          className="message-actions"
                          sx={{
                            position: 'absolute',
                            top: -10,
                            right: ownMessage ? 'auto' : -10,
                            left: ownMessage ? -10 : 'auto',
                            bgcolor: 'background.paper',
                            borderRadius: 2,
                            boxShadow: 1,
                            opacity: 0,
                            transition: 'opacity 0.2s',
                            display: 'flex',
                            gap: 0.5,
                            p: 0.5,
                            zIndex: 1,
                          }}
                        >
                          <Tooltip title="Reply">
                            <IconButton 
                              size="small"
                              onClick={() => handleReply(message)}
                            >
                              <ReplyIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          
                          {ownMessage && (
                            <>
                              <Tooltip title="Edit">
                                <IconButton 
                                  size="small"
                                  onClick={() => handleEdit(message)}
                                >
                                  <EditIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              
                              <Tooltip title="Delete">
                                <IconButton 
                                  size="small"
                                  onClick={() => handleDelete(message)}
                                >
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </>
                          )}
                        </Box>
                      )}
                      
                      {renderMessageContent(message)}
                      
                      <Box sx={{ 
                        display: 'flex', 
                        justifyContent: 'flex-end',
                        alignItems: 'center',
                        mt: 0.5,
                        minHeight: 20
                      }}>
                        <Typography 
                          variant="caption" 
                          sx={{ 
                            opacity: 0.8,
                            fontSize: '0.75rem'
                          }}
                        >
                          {formatMessageTime(message.createdAt)}
                        </Typography>
                        
                        {/* Message Status Indicator */}
                        {ownMessage && !message.isDeleted && (
                          <Box sx={{ display: 'flex', ml: 0.5 }}>
                            <CheckIcon fontSize="small" />
                          </Box>
                        )}
                      </Box>
                    </Paper>
                  </Box>

                  {ownMessage && currentUser && (
                    <ListItemAvatar sx={{ minWidth: 40, alignSelf: 'flex-start' }}>
                      <Avatar 
                        src={currentUser.profilePic}
                        sx={{ width: 32, height: 32 }}
                      >
                        {currentUser.username.charAt(0)}
                      </Avatar>
                    </ListItemAvatar>
                  )}
                </ListItem>
              </Fade>
            );
          })}
          
          {/* Typing Indicator */}
          {isTyping && (
            <Slide direction="up" in={isTyping}>
              <ListItem sx={{ justifyContent: 'flex-start', py: 0.5 }}>
                <ListItemAvatar sx={{ minWidth: 40 }}>
                  <Avatar sx={{ width: 32, height: 32 }}>
                    {chat.name.charAt(0)}
                  </Avatar>
                </ListItemAvatar>
                <Paper
                  elevation={0}
                  sx={{
                    p: 1.5,
                    borderRadius: 18,
                    borderTopLeftRadius: 0,
                    bgcolor: 'background.paper'
                  }}
                >
                  <Box sx={{ display: 'flex', gap: 0.5 }}>
                    <Box
                      sx={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        bgcolor: 'text.disabled',
                        animation: 'pulse 1.5s infinite',
                        animationDelay: '0s',
                      }}
                    />
                    <Box
                      sx={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        bgcolor: 'text.disabled',
                        animation: 'pulse 1.5s infinite',
                        animationDelay: '0.2s',
                      }}
                    />
                    <Box
                      sx={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        bgcolor: 'text.disabled',
                        animation: 'pulse 1.5s infinite',
                        animationDelay: '0.4s',
                      }}
                    />
                  </Box>
                </Paper>
              </ListItem>
            </Slide>
          )}
          
          <div ref={messagesEndRef} />
        </List>
      </Box>

      {/* Reply/Edit Preview */}
      {(replyToMessage || editMessage) && (
        <Paper
          elevation={2}
          sx={{
            mx: 2,
            mt: 1,
            p: 1,
            borderRadius: 1,
            bgcolor: 'background.paper',
            borderLeft: 3,
            borderColor: editMessage ? 'warning.main' : 'primary.main',
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box>
              <Typography variant="caption" color="text.secondary">
                {editMessage ? 'Editing message' : 'Replying to'}
              </Typography>
              <Typography variant="body2" noWrap sx={{ maxWidth: 300 }}>
                {editMessage ? editMessage.content : replyToMessage?.content}
              </Typography>
            </Box>
            <IconButton 
              size="small" 
              onClick={() => {
                setReplyToMessage(null);
                setEditMessage(null);
              }}
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>
        </Paper>
      )}

      {/* Scroll to Bottom Button */}
      {showScrollButton && (
        <Fab
          color="primary"
          size="small"
          onClick={scrollToBottom}
          sx={{
            position: 'absolute',
            bottom: 100,
            right: 20,
            zIndex: 1000,
          }}
        >
          <KeyboardVoiceIcon />
        </Fab>
      )}

      {/* Message Input Area */}
      <Box
        sx={{
          p: 2,
          bgcolor: 'grey.50',
          borderTop: 1,
          borderColor: 'divider'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Tooltip title="Attach file">
            <IconButton color="primary">
              <AttachFileIcon />
            </IconButton>
          </Tooltip>
          
          <TextField
            inputRef={inputRef}
            fullWidth
            multiline
            maxRows={4}
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={editMessage ? "Edit your message..." : "Type a message..."}
            variant="outlined"
            size="small"
            InputProps={{
              sx: { borderRadius: 6 },
              startAdornment: (
                <InputAdornment position="start">
                  <Tooltip title="Emoji">
                    <IconButton size="small">
                      <InsertEmoticonIcon />
                    </IconButton>
                  </Tooltip>
                </InputAdornment>
              ),
            }}
          />
          
          {inputMessage.trim() ? (
            <Tooltip title={editMessage ? "Save changes" : "Send"}>
              <span>
                <IconButton 
                  color="primary" 
                  onClick={handleSendMessage}
                  disabled={isSending}
                  sx={{ 
                    bgcolor: 'primary.main',
                    color: 'white',
                    '&:hover': {
                      bgcolor: 'primary.dark'
                    }
                  }}
                >
                  {isSending ? (
                    <CircularProgress size={24} color="inherit" />
                  ) : editMessage ? (
                    <CheckIcon />
                  ) : (
                    <SendIcon />
                  )}
                </IconButton>
              </span>
            </Tooltip>
          ) : (
            <Tooltip title="Voice message">
              <IconButton color="primary">
                <MicIcon />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      </Box>

      {/* Delete Message Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>Delete Message</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this message? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button 
            color="error" 
            variant="contained"
            onClick={() => {
              // Call delete message API here
              console.log('Delete message:', messageToDelete?.id);
              setDeleteDialogOpen(false);
              setMessageToDelete(null);
            }}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

// Add styles to document head
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement("style");
  styleSheet.innerText = `
    @keyframes pulse {
      0%, 100% { opacity: 0.4; }
      50% { opacity: 1; }
    }
  `;
  document.head.appendChild(styleSheet);
}
