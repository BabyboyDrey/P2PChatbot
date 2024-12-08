"use client";
import { useState, useEffect } from "react";
import { io } from "socket.io-client";
import { useRouter } from "next/navigation";
import Image from "next/image";
import logo from "./assets/logo.png";
import { IoSearchSharp, IoClose } from "react-icons/io5";
import axios from "axios";
import { IoMdSend } from "react-icons/io";

export default function Home() {
  const [socket, setSocket] = useState(null);
  const [userInfo, setUserInfo] = useState(null);
  const [seeContactDets, setSeeContactDets] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [currentChat, setCurrentChat] = useState(null);
  const [messages, setMessages] = useState([
    {
      id: "1",
      sender: "David Moore",
      text: "OMG do you remember what you did last night at the work night out?",
      time: "8:12 am",
    },
    { id: "2", sender: "You", text: "no haha", time: "8:16 pm" },
    {
      id: "3",
      sender: "You",
      text: "I don't remember anything",
      time: "8:16 pm",
    },
  ]);
  const [newMessage, setNewMessage] = useState("");
  const currentContact = contacts.find(
    (contact) => contact._id === currentChat
  );
  const router = useRouter();
  const baseUrl = process.env.NEXT_PUBLIC_BACKEND_BASE_URL;

  useEffect(() => {
    setUserInfo(localStorage.getItem("user_info", JSON.parse(userInfo)));
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("au_t");
    const expirationTime = localStorage.getItem("au_t_expiry");

    if (token && expirationTime) {
      if (Date.now() > expirationTime) {
        localStorage.removeItem("au_t");
        localStorage.removeItem("au_t_expiry");
        router.push("/register");
      }
    } else {
      router.push("/register");
    }
  }, []);

  useEffect(() => {
    const newSocket = io(`${baseUrl}`, {
      transports: ["websocket", "polling"],
    });
    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [baseUrl]);

  useEffect(() => {
    if (socket === null) return;

    socket.on("disconnect", () => {
      console.log("Disconnected from server");
      const currentUser = JSON.parse(localStorage.getItem("user_info"));
      setOnlineUsers((prevUsers) =>
        prevUsers.filter((user) => user !== `user:${currentUser._id}`)
      );

      socket.emit("refreshOnlineUsers");
    });

    const currentUser = JSON.parse(localStorage.getItem("user_info"));
    console.log("currentUser:", currentUser);

    if (currentUser && currentUser._id) {
      socket.emit("addUsers", currentUser._id);
    } else {
      console.error("User information is not available or invalid.");
      router.push("/register");
    }

    socket.on("getOnlineUsers", (users) => {
      setOnlineUsers(users);
    });

    socket.on("refreshOnlineUsers", (users) => {
      setOnlineUsers(users);
    });

    return () => {
      socket.off("getOnlineUsers");
      socket.off("disconnect");
    };
  }, [socket, router]);

  useEffect(() => {
    const fetchContacts = async () => {
      const token = localStorage.getItem("au_t");
      if (!token) return;

      try {
        const response = await axios.get(
          `${baseUrl}/api/v1/user/get-all-users`,
          {
            withCredentials: true,
          }
        );
        if (response.status === 200) {
          setContacts(response.data.users);
        } else {
          console.error("Failed to fetch users:", response.data.message);
        }
      } catch (error) {
        console.error("Error fetching users:", error);
      }
    };

    fetchContacts();
  }, [baseUrl]);

  useEffect(() => {
    if (socket === null) return;

    socket?.emit("refreshOnlineUsers");

    return () => {
      socket.off("refreshOnlineUsers");
    };
  }, [socket]);

  useEffect(() => {
    console.log("contacts:", contacts);
  }, [contacts]);

  useEffect(() => {
    if (!socket || !currentContact) return;
    console.log("userInfo:", userInfo);
    // Handle incoming messages
    const handleIncomingMessage = (message, callback) => {
      console.log("handling incoming message", callback);
      console.log("Message received sending callback:", message);
      callback && callback({ status: "received" });
      console.log(
        "recipient socket id:",
        message.currentContactId,
        "currentContact._id:",
        currentContact._id
      );
      if (!message || !message.currentContactId) {
        console.error("Invalid message received:", message);
        return; // Return early if the message is invalid
      }

      console.log("handling incoming message");
      console.log("Message received:", message);

      if (currentContact._id === message.currentContactId) {
        setMessages((prevMessages) => {
          const updatedMessages = [
            ...prevMessages,
            {
              id: Date.now().toString(),
              sender: message.sender,
              text: message.text,
              time: message.time || new Date().toLocaleTimeString(),
            },
          ];
          console.log("Updated messages:", updatedMessages);
          return updatedMessages;
        });
      }
    };

    socket.on("getMessage", handleIncomingMessage);

    return () => {
      socket.off("getMessage", handleIncomingMessage); // Clean up the listener
    };
  }, [socket, currentContact]);

  const handleSendMessage = () => {
    console.log("newMessage:", newMessage);
    if (newMessage.trim() === "") return;

    const message = {
      currentContactId: currentContact._id,
      sender: "You",
      text: newMessage,
      time: new Date().toLocaleTimeString(),
    };

    console.log("sending message:", message);

    socket.emit("sendMessage", message, (ack) => {
      console.log("sending message:", message);
      console.log("ack:", ack);
      if (ack && ack.status === "delivered") {
        console.log("Message delivered:", ack);
      } else {
        console.log("Message not delivered:", ack);
      }
    });

    setNewMessage(""); // Clear the input after sending
  };

  return (
    <div className="h-screen flex items-center justify-center">
      <div className="w-[90%] max-w-6xl h-[80%] bg-white rounded-lg shadow-lg flex">
        <div className="w-1/3 bg-white border-r border-gray-300 overflow-y-auto">
          <div className="p-4 text-lg font-bold ">
            <div>
              <Image width={100} height={100} src={logo} alt="Logo" />
            </div>
          </div>

          <div className="p-4">
            <div className="flex items-center bg-[#f5f5f5] rounded-full px-4 py-2">
              <IoSearchSharp className="text-placeholder_grey text-lg" />
              <input
                type="text"
                className="flex-1 bg-transparent focus:outline-none text-placeholder_grey ml-2"
                placeholder="Search"
              />
            </div>
          </div>

          <div>
            {contacts.map((contact) => {
              const isOnline = onlineUsers.some(
                (user) => user === `user:${contact._id}` // Match user ID format
              );
              return (
                <div
                  key={contact._id} // Use contact._id as unique key
                  onClick={() => setCurrentChat(contact._id)} // Set currentChat to contact._id
                  className={`flex items-center px-4 py-3 cursor-pointer ${
                    currentChat === contact._id
                      ? "bg-gray-200"
                      : "hover:bg-gray-100"
                  }`}
                >
                  <div className="relative h-[48px] w-[48px] bg-main_grey text-white flex items-center justify-center rounded-full">
                    {
                      contact.name
                        .split(" ")
                        .slice(0, 2) // Get first two names
                        .map((word) => word.charAt(0).toUpperCase()) // Take the first letter of each
                        .join("") // Combine the letters
                    }
                    {isOnline && (
                      <div className="absolute bg-online_green w-3 h-3 rounded-full top-0 right-0"></div>
                    )}
                  </div>
                  <div className="ml-3 flex-1">
                    <div className="font-semibold text-black">
                      {contact.name}
                    </div>
                    <div className="text-sm text-gray-500 truncate">
                      {contact.lastMessage}
                    </div>
                  </div>
                  <div className="text-xs text-placeholder_grey flex flex-col justify-between h-full gap-2">
                    {contact.time}
                    {contact.unread && (
                      <span className="text-white text-[10px] flex justify-center items-center ml-2 h-4 w-4 bg-notifications_popup_blue rounded-full">
                        2
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {currentChat !== null && (
          <div className="w-2/3 flex">
            <div
              className={`${
                seeContactDets ? "w-2/3" : "w-full"
              } bg-[#f5f5f5] h-full flex flex-col transition-all duration-300 ease-in-out`}
            >
              <div className="p-4 flex justify-start items-center gap-3 bg-white border-b border-gray-300 text-lg text-black font-bold">
                <div
                  onClick={() => setSeeContactDets(!seeContactDets)}
                  className="h-10 w-10 bg-main_grey text-white flex items-center justify-center rounded-full text-sm font-semibold cursor-pointer"
                >
                  {currentContact.name
                    .split(" ")
                    .slice(0, 2)
                    .map((word) => word.charAt(0).toUpperCase())
                    .join("")}
                </div>
                {currentContact.name}
              </div>

              <div className="flex-1 p-4 overflow-y-auto">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`mb-4 ${
                      message.sender === "You" ? "text-right" : "text-left"
                    }`}
                  >
                    <div
                      className={`inline-block px-4 py-2 rounded-lg ${
                        message.sender === "You"
                          ? "bg-notifications_popup_blue text-white"
                          : "bg-gray-200 text-gray-800"
                      }`}
                    >
                      {message.text}
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      {message.time}
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-transparent p-3 flex items-center justify-center gap-2">
                <div className="w-[70%] flex justify-center items-center h-14 border border-gray-300 rounded-lg focus-within:ring-2 focus-within:ring-main_blue transition duration-200">
                  <input
                    type="text"
                    className="flex-1 text-main_grey p-3 rounded-tl-lg rounded-bl-lg focus:outline-none h-full"
                    placeholder="Type a message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                  />
                  <button
                    className="border-l-0 border-gray-300 text-send_button_blue p-3 bg-white h-full rounded-tr-lg rounded-br-lg transition duration-200"
                    onClick={() => {
                      if (newMessage.trim()) {
                        handleSendMessage();
                      }
                    }}
                  >
                    <IoMdSend size={25} />
                  </button>
                </div>
              </div>
            </div>
            {seeContactDets && currentContact && (
              <div className="w-1/3 border-l border-gray-300 p-2  h-full flex flex-col transition-all duration-300 ease-in-out">
                <div>
                  <IoClose
                    onClick={() => setSeeContactDets(false)}
                    className="mr-auto text-xl cursor-pointer text-black"
                  />
                </div>
                <div className="h-full flex flex-col justify-start items-center gap-2">
                  <div className="h-[135px] w-[135px] bg-main_grey text-white flex items-center justify-center rounded-full text-5xl font-semibold">
                    {currentContact.name
                      .split(" ")
                      .slice(0, 2)
                      .map((word) => word.charAt(0).toUpperCase())
                      .join("")}
                  </div>
                  <h3 className="text-black text-lg">{currentContact.name}</h3>
                  <div className="flex flex-col justify-start items-center gap-1">
                    <p className="text-placeholder_grey text-sm">
                      {currentContact.phoneNumber}
                    </p>
                    <p className="text-placeholder_grey text-sm">
                      {currentContact.email}
                    </p>
                  </div>
                  <hr className="my-4 w-[80%] border-t border-[#d4d4d4]" />
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
