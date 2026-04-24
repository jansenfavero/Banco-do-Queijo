import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../hooks/useAuth';
import { db } from '../lib/firebase';
import { collection, query, where, onSnapshot, orderBy, addDoc, updateDoc, doc, getDoc, serverTimestamp, getDocs } from 'firebase/firestore';
import { Card } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Send, ArrowLeft, MessageCircle, Mic } from 'lucide-react';
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
  
  const [isRecording, setIsRecording] = useState(false);
  const [recognition, setRecognition] = useState<any>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const rec = new SpeechRecognition();
        rec.continuous = false;
        rec.interimResults = true;
        rec.lang = 'pt-BR';

        rec.onresult = (event: any) => {
          const transcript = Array.from(event.results)
            .map((result: any) => result[0])
            .map((result: any) => result.transcript)
            .join('');
            
          setNewMessage(transcript);
        };

        rec.onerror = (event: any) => {
          console.error("Speech recognition error", event.error);
          setIsRecording(false);
        };

        rec.onend = () => {
          setIsRecording(false);
        };

        setRecognition(rec);
      }
    }
  }, []);

  const toggleRecording = () => {
    if (!recognition) {
        import('sonner').then(m => m.toast.error("O Google Chrome não autorizou ou seu navegador não suporta reconhecimento de voz direto."));
        return;
    }
    
    if (isRecording) {
      recognition.stop();
      setIsRecording(false);
    } else {
      setNewMessage('');
      recognition.start();
      setIsRecording(true);
      import('sonner').then(m => m.toast.info("Grave seu áudio... Fale agora."));
    }
  };

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
      where('participants', 'array-contains', user.uid)
    );
    
    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const chatsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as any }));
      // Sort locally to avoid complex query indexing issues
      chatsData.sort((a, b) => {
         const timeA = a.updatedAt?.toMillis ? a.updatedAt.toMillis() : 0;
         const timeB = b.updatedAt?.toMillis ? b.updatedAt.toMillis() : 0;
         return timeB - timeA;
      });
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
          if (String(id).startsWith('mock-')) {
             setOtherUsersMap(prev => ({ 
                ...prev, 
                [id]: {
                   id,
                   name: String(id).includes('prod') ? 'Queijaria Exemplo (Demonstração)' : 'Atacadista Exemplo (Demonstração)',
                   role: String(id).includes('prod') ? 'PRODUTOR' : 'ATACADISTA',
                   images: []
                }
             }));
             continue;
          }
          const userDoc = await getDoc(doc(db, 'users', id));
          if (userDoc.exists()) {
            setOtherUsersMap(prev => ({ ...prev, [id]: userDoc.data() }));
          } else {
             // Fallback for mock IDs that don't start with mock-, or deleted users
             setOtherUsersMap(prev => ({ 
                ...prev, 
                [id]: {
                   id,
                   name: isNaN(Number(id)) ? id : `Contato Exemplo ${id}`, // If it's "Laticínio Nordeste", use that name
                   role: 'PRODUTOR',
                   images: []
                }
             }));
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
    } catch (error: any) {
      console.error("Error sending message", error);
      import('sonner').then(m => m.toast.error("Erro ao enviar. Verifique as regras (Rules) de Escrita e Leitura no Console do Firebase."));
    }
  };

  const formatTime = (timestamp: any) => {
    if (!timestamp) return '';
    const d = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 flex-1 flex flex-col md:flex-row gap-4 md:gap-6 max-w-[1400px] mx-auto w-full min-h-0 relative">
      
      {/* Sidebar List */}
      <Card className={`bg-[#361500] border-white/5 flex flex-col overflow-hidden w-full md:w-[380px] drop-shadow-lg rounded-[24px] ${activeChatId ? 'hidden md:flex' : 'flex'} flex-1 md:flex-none h-full min-h-[400px] md:min-h-0 max-h-full`}>
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
                           import('sonner').then(m => m.toast.error("Bloqueio de Permissão! Acesse seu Firebase Console > Firestore Database > Rules e atualize as regras para liberar a rota /chats/ e /messages/ ou cole o firestore.rules lá."));
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
      <Card className={`bg-[#361500] border-white/5 flex flex-col flex-1 overflow-hidden w-full filter drop-shadow-lg rounded-[24px] ${!activeChatId ? 'hidden md:flex' : 'flex'} flex-1 h-full min-h-[400px] md:min-h-0 max-h-full`}>
        {!activeChatId ? (
          <div className="flex-1 flex flex-col items-center justify-center text-white/40 p-8 text-center">
            <MessageCircle className="w-16 h-16 mb-4 opacity-50" />
            <p className="text-lg">Selecione uma conversa ao lado para iniciar</p>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="p-4 border-b border-[#a64b00] bg-[#d36101] flex items-center gap-3 shrink-0">
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
                       <div className={`max-w-[85%] md:max-w-[70%] rounded-[20px] px-4 py-2.5 ${isMine ? 'bg-app-accent text-[#361500] font-medium rounded-br-none' : 'bg-[#d36101] text-white font-medium rounded-bl-none border border-[#a64b00]'}`}>
                          {msg.messageType === 'offer' && msg.offerData ? (
                             <div className="bg-black/20 p-3 rounded-lg mb-2 text-sm border border-white/10">
                               <p className="font-bold text-app-accent mb-1">📦 Oferta Comercial</p>
                               <p><strong>Queijo:</strong> {msg.offerData.cheeseType}</p>
                               <p><strong>Volume:</strong> {msg.offerData.quantityKg} Kg</p>
                               <p><strong>Preço:</strong> R$ {msg.offerData.price.toFixed(2)} /Kg</p>
                             </div>
                          ) : null}
                          <p className="text-sm whitespace-pre-wrap word-break-words">{msg.text}</p>
                          <p className={`text-[10px] mt-1 text-right ${isMine ? 'text-app-bgDark/60 font-bold' : 'text-white/60 font-bold'}`}>
                             {formatTime(msg.createdAt)}
                          </p>
                       </div>
                     </div>
                   );
                 })
               )}
               <div ref={messagesEndRef} />
            </div>
            
            {/* Input Area */}
            <div className="p-4 border-t border-[#a64b00] bg-[#d36101] shrink-0">
               <form onSubmit={handleSendMessage} className="flex gap-3">
                 <Input 
                   value={newMessage}
                   onChange={e => setNewMessage(e.target.value)}
                   placeholder="Mensagem de texto ou áudio..."
                   className="flex-1 bg-black/20 border-[#a64b00] text-white placeholder:text-white/60 focus:ring-black/40 focus:border-black/40 h-12 rounded-xl"
                 />
                 <Button type="button" onClick={toggleRecording} className={`h-12 w-12 p-0 rounded-xl transition-colors shrink-0 border border-[#a64b00] ${isRecording ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse' : 'bg-[#a64b00] hover:bg-black/20 text-white'}`}>
                    <Mic className="w-5 h-5" />
                 </Button>
                 <Button type="submit" disabled={!newMessage.trim()} className="h-12 w-12 p-0 rounded-xl bg-app-accent hover:bg-app-accentHover text-[#361500] shrink-0 border border-app-accent disabled:opacity-50 disabled:bg-[#a64b00] disabled:text-white/50 disabled:border-[#a64b00]">
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
