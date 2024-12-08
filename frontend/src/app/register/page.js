"use client";
import { useState } from "react";
import Image from "next/image";
import { toast, Toaster } from "react-hot-toast";
import logo from "../assets/logo.png";
import dottedShape from "../assets/dottedShape.png";
import axios from "axios";
import { useRouter } from "next/navigation";

const Page = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const router = useRouter();

  // async function handleFormSubmit() {
  //   if (!name || !email || !phoneNumber) {
  //     toast.error("Please fill out all fields!");
  //     return;
  //   }

  //   const formData = {
  //     name,
  //     email,
  //     phoneNumber,
  //   };

  //   const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

  //   try {
  //     console.log("url:", `${apiUrl}/user/register`);
  //     await axios.post(`${apiUrl}/user/register`, formData, {
  //       withCredentials: true,
  //     });
  //     localStorage.setItem("au_t", document.cookie.au_t);
  //     toast.success("Form submitted successfully!");

  //     setTimeout(() => {
  //       router.push("/");
  //     }, 2000);
  //   } catch (err) {
  //     console.error("Axios error:", err);

  //     if (err.response) {
  //       toast.error(err.response.data.message || "An error occurred");
  //     } else {
  //       toast.error("An unexpected error occurred");
  //     }
  //   }
  // }

  async function handleFormSubmit() {
    if (!name || !email || !phoneNumber) {
      toast.error("Please fill out all fields!");
      return;
    }

    const formData = {
      name,
      email,
      phoneNumber,
    };

    const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

    try {
      console.log("url:", `${apiUrl}/user/register`);
      await axios
        .post(`${apiUrl}/user/register`, formData, {
          withCredentials: true,
        })
        .then((res) => {
          console.log("res.data.user_token:", res.data.user_token);
          console.log("res.data:", res.data);
          const expirationTime = Date.now() + 8 * 60 * 60 * 1000;
          localStorage.setItem("au_t", res.data.user_token);
          localStorage.setItem("au_t_expiry", expirationTime);
          localStorage.setItem("user_info", JSON.stringify(res.data.user));
        });

      toast.success("Form submitted successfully!");

      setTimeout(() => {
        router.push("/");
      }, 2000);
    } catch (err) {
      console.error("Axios error:", err);

      if (err.response) {
        toast.error(err.response.data.message || "An error occurred");
      } else {
        toast.error("An unexpected error occurred");
      }
    }
  }

  return (
    <div className="w-full h-screen flex flex-row justify-center items-center ">
      <div className="h-[549px] w-[520px] p-1 rounded-[8px] bg-white flex flex-col justify-start gap-8 items-center overflow-hidden">
        <div className="flex flex-row justify-end items-center w-full">
          <Image src={dottedShape} width={50} height={50} alt="Dotted Shape" />
        </div>
        <div className="flex flex-col justify-start h-[80%] gap-3 items-center w-full">
          <div>
            <Image width={120} height={120} src={logo} alt="Logo" />
          </div>

          <div className="flex flex-col justify-start gap-8 items-center ">
            <input
              className="w-[400px] h-[50px] p-2 rounded-md text-placeholder_grey placeholder:text-placeholder_grey font-inter border border-placeholder_grey focus:outline-none focus:ring-2 focus:ring-base_blue"
              type="text"
              placeholder="Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <input
              className="w-[400px] h-[50px] p-2 rounded-md text-placeholder_grey placeholder:text-placeholder_grey font-inter border border-placeholder_grey focus:outline-none focus:ring-2 focus:ring-base_blue"
              type="text"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <input
              className="w-[400px] h-[50px] p-2 rounded-md text-placeholder_grey placeholder:text-placeholder_grey font-inter border border-placeholder_grey focus:outline-none focus:ring-2 focus:ring-base_blue"
              type="text"
              placeholder="Phone number"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
            />
          </div>
          <div className="flex flex-row justify-center items-center w-full h-full">
            <button
              className="cursor-pointer w-[400px] h-[50px] p-2 rounded-md bg-main_grey text-white font-inter"
              onClick={handleFormSubmit}
            >
              Sign up
            </button>
          </div>
        </div>
        <div className="flex flex-row justify-start items-center w-full">
          <Image src={dottedShape} width={50} height={50} alt="Dotted Shape" />
        </div>
      </div>
      <Toaster />
    </div>
  );
};

export default Page;
