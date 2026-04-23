import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../hooks/useAuth';
import { db } from '../lib/firebase';
import { collection, query, where, onSnapshot, orderBy, addDoc, updateDoc, doc, getDoc, serverTimestamp, getDocs } from 'firebase/firestore';
import { Card } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Send, ArrowLeft, MessageCircle } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { removeAccents } from '../lib/utils';

export function Messages() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialChatId = searchParams.get('c');
  
  const [chats, setChats] = useState<any[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(initialChatId);
  const [activeChat, setActiveChat] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [otherUsersMap, setOtherUsersMap] = useState<Record<string, any>>({});
  
  const [searchQuery, setSearchQuery] = useState('');
  const [availableUsers, setAvailableUsers] = useState<any[]>([]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize active chat if provided via query param
  useEffect(() => {
    if (initialChatId) {
      setActiveChatId(initialChatId);
    }
  }, [initialChatId]);

  // Load available users to start a chat with
  useEffect(() => {
    if (!profile) return;
    const q = query(
      collection(db, 'users'),
      where('kycStatus', '==', 'VALIDADO')
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      let targetRoles: string[] = [];
      if (profile.role === 'PRODUTOR') targetRoles = ['ATACADISTA'];
      else if (profile.role === 'ATACADISTA') targetRoles = ['PRODUTOR'];
      else targetRoles = ['PRODUTOR', 'ATACADISTA'];
      
      const usersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any)).filter((u: any) => u.id !== profile.id && targetRoles.includes(u.role));
      setAvailableUsers(usersData);
    });
    return () => unsubscribe();
  }, [profile]);

  // Load chat list
  useEffect(() => {
    if (!user) return;
    
    const q = query(
      collection(db, 'chats'),
      where('participants', 'array-contains', user.uid),
      orderBy('updatedAt', 'desc')
    );
    
    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const chatsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setChats(chatsData);
      
      // Fetch user details for the other participants
      const usersToFetch = new Set<string>();
      chatsData.forEach((chat: any) => {
        const otherId = chat.participants.find((p: string) => p !== user.uid);
        if (otherId && !otherUsersMap[otherId]) {
          usersToFetch.add(otherId);
        }
      });
      
      for (const id of Array.from(usersToFetch)) {
        try {
          const userDoc = await getDoc(doc(db, 'users', id));
          if (userDoc.exists()) {
            setOtherUsersMap(prev => ({ ...prev, [id]: userDoc.data() }));
          }
        } catch (error) {
          console.error("Error fetching user", id, error);
        }
      }
    });
    
    return () => unsubscribe();
  }, [user]);

  // Load active chat and its messages
  useEffect(() => {
    if (!activeChatId || !user) {
      setMessages([]);
      setActiveChat(null);
      return;
    }
    
    const chatDetails = chats.find(c => c.id === activeChatId);
    if (chatDetails) {
      setActiveChat(chatDetails);
      
      // Clear unread count for this user
      if (chatDetails.unreadCount && chatDetails.unreadCount[user.uid] > 0) {
        updateDoc(doc(db, 'chats', activeChatId), {
           [`unreadCount.${user.uid}`]: 0
        }).catch(console.error);
      }
    } else {
      // Chat might not be in the list yet if newly created, fetch it directly
      getDoc(doc(db, "chats", activeChatId)).then((docSnap) => {
        if (docSnap.exists() && docSnap.data().participants.includes(user.uid)) {
          setActiveChat({ id: docSnap.id, ...docSnap.data() });
          
          if (docSnap.data().unreadCount && docSnap.data().unreadCount[user.uid] > 0) {
            updateDoc(docSnap.ref, {
               [`unreadCount.${user.uid}`]: 0
            }).catch(console.error);
          }
          
          // Also fetch the other user if missing
          const otherId = docSnap.data().participants.find((p: string) => p !== user.uid);
          if (otherId && !otherUsersMap[otherId]) {
            getDoc(doc(db, 'users', otherId)).then(uDoc => {
               if (uDoc.exists()) setOtherUsersMap(prev => ({ ...prev, [otherId]: uDoc.data() }));
            });
          }
        }
      });
    }

    const q = query(
      collection(db, `chats/${activeChatId}/messages`),
      orderBy('createdAt', 'asc')
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setMessages(msgs);
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    });
    
    return () => unsubscribe();
  }, [activeChatId, chats, user]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeChatId || !user) return;
    
    const text = newMessage.trim();
    setNewMessage('');
    
    const otherParticipantId = activeChat?.participants?.find((p: string) => p !== user.uid);
    if (!otherParticipantId) return;

    try {
      // Add message
      await addDoc(collection(db, `chats/${activeChatId}/messages`), {
        senderId: user.uid,
        text: text,
        messageType: 'text',
        read: false,
        createdAt: serverTimestamp()
      });
      
      // Update chat last message
      await updateDoc(doc(db, 'chats', activeChatId), {
        lastMessage: text,
        lastMessageTime: serverTimestamp(),
        updatedAt: serverTimestamp(),
        // Increment unread count for the other user using Firestore increment instead if possible, 
        // but since we keep logic simple we'll just read and update. 
        // A robust way uses a transaction, for now we set to (current or 0) + 1
        // We know `activeChat` has current state
        [`unreadCount.${otherParticipantId}`]: (activeChat?.unreadCount?.[otherParticipantId] || 0) + 1
      });
    } catch (error) {
      console.error("Error sending message", error);
    }
  };

  const formatTime = (timestamp: any) => {
    if (!timestamp) return '';
    const d = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 h-[calc(100vh-80px)] max-h-[calc(100vh-80px)] flex flex-col md:flex-row gap-6 max-w-7xl mx-auto w-full">
      
      {/* Sidebar List */}
      <Card className={`bg-app-cardDark border-white/10 flex flex-col h-full overflow-hidden w-full md:w-1/3 filter drop-shadow-lg ${activeChatId ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-5 border-b border-white/10 shrink-0">
          <h2 className="text-xl font-bold text-white flex items-center gap-2 mb-4">
            <MessageCircle className="w-5 h-5 text-app-accent" />
            Mensagens
          </h2>
          <Input 
            placeholder={`Buscar por nome ou empresa...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-black/20 border-white/10 text-white placeholder:text-white/40 focus:ring-app-accent focus:border-app-accent rounded-[10px]"
          />
        </div>
        
        <div className="flex-1 overflow-y-auto w-full">
          {searchQuery.trim() !== '' ? (
             // Search Results View
             <div className="flex flex-col">
               <div className="px-4 py-2 bg-black/20 text-xs font-bold text-white/50 uppercase tracking-wider">
                  Resultados da Busca
               </div>
               {availableUsers
                 .filter(u => removeAccents(`${u.name} ${u.nomeFantasia || ''} ${u.razaoSocial || ''}`).toLowerCase().includes(removeAccents(searchQuery.toLowerCase())))
                  .map(foundUser => (
                   <div 
                      key={foundUser.id}
                      onClick={async () => {
                         try {
                           // Check if chat exists
                           const targetId = String(foundUser.id);
                           const existingChat = chats.find(c => c.participants && c.participants.includes(targetId));
                           if (existingChat) {
                              setActiveChatId(existingChat.id);
                              navigate(`/mensagens?c=${existingChat.id}`, { replace: true });
                              setSearchQuery('');
                           } else {
                              const newChatRef = await addDoc(collection(db, 'chats'), {
                                 participants: [String(user?.uid), targetId],
                                 createdAt: serverTimestamp(),
                                 updatedAt: serverTimestamp(),
                                 unreadCount: {}
                              });
                              setActiveChatId(newChatRef.id);
                              navigate(`/mensagens?c=${newChatRef.id}`, { replace: true });
                              setSearchQuery('');
                           }
                         } catch (error: any) {
                           console.error(error);
                           import('sonner').then(m => m.toast.error("Erro ao processar clique: " + error.message));
                         }
                      }}
                      className="p-4 border-b border-white/5 cursor-pointer hover:bg-white/5 transition-colors flex items-center gap-4 group"
                   >
                      <div className="w-10 h-10 shrink-0 bg-app-bgDark rounded-full flex items-center justify-center text-app-accent font-bold text-sm overflow-hidden border border-white/10">
                         {foundUser?.images?.[0] ? (
                            <img src={foundUser.images[0]} alt={foundUser.name} className="w-full h-full object-cover" />
                         ) : (
                            foundUser?.name?.slice(0,2).toUpperCase() || '?'
                         )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-baseline mb-1">
                          <h3 className="text-white font-semibold truncate text-sm group-hover:text-app-accent transition-colors">
                            {foundUser?.nomeFantasia || foundUser?.name}
                          </h3>
                        </div>
                        <p className="text-xs text-[#FAE678] truncate">{foundUser.role === 'PRODUTOR' ? 'Produtor' : 'Atacadista'} • Clique para Iniciar Chat</p>
                      </div>
                   </div>
                 ))}
                 {availableUsers.filter(u => removeAccents(`${u.name} ${u.nomeFantasia || ''} ${u.razaoSocial || ''}`).toLowerCase().includes(removeAccents(searchQuery.toLowerCase()))).length === 0 && (
                    <div className="p-4 text-center text-white/50 text-sm">
                       Nenhum usuário encontrado com a busca atual.
                    </div>
                 )}
             </div>
          ) : (
             // Existing Chats View
             <>
                {chats.length === 0 ? (
                   <div className="p-8 text-center text-white/50 text-sm">
                      Nenhuma conversa iniciada ainda. Use a busca acima para encontrar parceiros comerciais ou inicie pela aba Explorar/Vitrine.
                   </div>
                ) : (
                  chats.map(chat => {
              const otherId = chat.participants.find((p: string) => p !== user?.uid);
              const otherUser = otherUsersMap[otherId];
              const unread = chat.unreadCount?.[user?.uid || ''] || 0;
              const isActive = chat.id === activeChatId;
              
              return (
                <div 
                  key={chat.id} 
                  onClick={() => {
                     setActiveChatId(chat.id);
                     navigate(`/mensagens?c=${chat.id}`, { replace: true });
                  }}
                  className={`p-4 border-b border-white/5 cursor-pointer hover:bg-white/5 transition-colors flex items-center gap-4 ${isActive ? 'bg-white/10' : ''}`}
                >
                  <div className="w-12 h-12 shrink-0 bg-app-bgDark rounded-full flex items-center justify-center text-app-accent font-bold text-lg overflow-hidden border border-white/10">
                     {otherUser?.images?.[0] ? (
                        <img src={otherUser.images[0]} alt={otherUser.name} className="w-full h-full object-cover" />
                     ) : (
                        otherUser?.name?.slice(0,2).toUpperCase() || '?'
                     )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline mb-1">
                      <h3 className="text-white font-semibold truncate text-sm">
                        {otherUser?.nomeFantasia || otherUser?.name || 'Carregando...'}
                      </h3>
                      <span className="text-xs text-white/40 shrink-0 ml-2">
                         {formatTime(chat.lastMessageTime)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center gap-2">
                       <p className={`text-sm truncate min-w-0 ${unread > 0 ? 'text-white font-medium' : 'text-white/60'}`}>
                         {chat.lastMessage || 'Nenhuma mensagem.'}
                       </p>
                       {unread > 0 && (
                          <div className="shrink-0 bg-app-accent text-app-bgDark text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
                            {unread}
                          </div>
                       )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
          </>
          )}
        </div>
      </Card>
      
      {/* Active Chat Area */}
      <Card className={`bg-app-cardDark border-white/10 flex flex-col h-full overflow-hidden w-full md:w-2/3 filter drop-shadow-lg ${!activeChatId ? 'hidden md:flex' : 'flex'}`}>
        {!activeChatId ? (
          <div className="flex-1 flex flex-col items-center justify-center text-white/40 p-8 text-center">
            <MessageCircle className="w-16 h-16 mb-4 opacity-50" />
            <p className="text-lg">Selecione uma conversa ao lado para iniciar</p>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="p-4 border-b border-white/10 bg-app-bgDark/30 flex items-center gap-3 shrink-0">
              <button 
                onClick={() => {
                   setActiveChatId(null);
                   navigate('/mensagens', { replace: true });
                }}
                className="md:hidden p-2 -ml-2 text-white/70 hover:text-white"
              >
                <ArrowLeft className="w-6 h-6" />
              </button>
              
              {activeChat && (
                <>
                  {(() => {
                    const otherId = activeChat.participants.find((p: string) => p !== user?.uid);
                    const otherUser = otherUsersMap[otherId];
                    return (
                      <>
                        <div className="w-10 h-10 shrink-0 bg-app-bgDark rounded-full flex items-center justify-center text-app-accent font-bold overflow-hidden border border-white/10">
                           {otherUser?.images?.[0] ? (
                              <img src={otherUser.images[0]} alt={otherUser.name} className="w-full h-full object-cover" />
                           ) : (
                              otherUser?.name?.slice(0,2).toUpperCase() || '?'
                           )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-white font-bold truncate">
                            {otherUser?.nomeFantasia || otherUser?.name || 'Usuário'}
                          </h3>
                          <p className="text-xs text-white/50 truncate">
                             {otherUser?.role === 'PRODUTOR' ? 'Produtor' : 'Atacadista'}
                          </p>
                        </div>
                      </>
                    );
                  })()}
                </>
              )}
            </div>
            
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6 flex flex-col gap-4">
               {messages.length === 0 ? (
                 <div className="flex-1 flex items-center justify-center text-white/40 text-sm italic">
                    Nenhuma mensagem registrada ainda. Comece a negociar!
                 </div>
               ) : (
                 messages.map(msg => {
                   const isMine = msg.senderId === user?.uid;
                   return (
                     <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                       <div className={`max-w-[85%] md:max-w-[70%] rounded-2xl px-4 py-2.5 ${isMine ? 'bg-[#d36101] text-white rounded-br-none' : 'bg-[#4a2000] text-white rounded-bl-none border border-white/5'}`}>
                          {msg.messageType === 'offer' && msg.offerData ? (
                             <div className="bg-black/20 p-3 rounded-lg mb-2 text-sm border border-white/10">
                               <p className="font-bold text-app-accent mb-1">📦 Oferta Comercial</p>
                               <p><strong>Queijo:</strong> {msg.offerData.cheeseType}</p>
                               <p><strong>Volume:</strong> {msg.offerData.quantityKg} Kg</p>
                               <p><strong>Preço:</strong> R$ {msg.offerData.price.toFixed(2)} /Kg</p>
                             </div>
                          ) : null}
                          <p className="text-sm whitespace-pre-wrap word-break-words">{msg.text}</p>
                          <p className={`text-[10px] mt-1 text-right ${isMine ? 'text-white/70' : 'text-white/50'}`}>
                             {formatTime(msg.createdAt)}
                          </p>
                       </div>
                     </div>
                   );
                 })
               )}
               <div ref={messagesEndRef} />
            </div>
            
            {/* Inpue Area */}
            <div className="p-4 border-t border-white/10 bg-app-bgDark/20 shrink-0">
               <form onSubmit={handleSendMessage} className="flex gap-3">
                 <Input 
                   value={newMessage}
                   onChange={e => setNewMessage(e.target.value)}
                   placeholder="Digite uma mensagem..."
                   className="flex-1 bg-black/30 border-white/10 text-white placeholder:text-white/40 focus:ring-[#d36101] focus:border-[#d36101] h-12 rounded-xl"
                 />
                 <Button type="submit" disabled={!newMessage.trim()} className="h-12 w-12 p-0 rounded-xl bg-[#d36101] hover:bg-[#b85200] text-white shrink-0">
                   <Send className="w-5 h-5 -ml-1" />
                 </Button>
               </form>
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
