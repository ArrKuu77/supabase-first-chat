import { useEffect, useRef, useState } from "react";
import { BiSolidSend } from "react-icons/bi";
import Swal from "sweetalert2";
import "./App.css";
import supabase from "./superbase-client";
import { VscLoading } from "react-icons/vsc";

function App() {
  const [todoList, setTodoList] = useState([]);
  const [newTodo, setNewTodo] = useState("");
  const [loading, setLoading] = useState(false);
  const listRef = useRef(null);
  const addTodo = async () => {
    setLoading(true);
    if (newTodo === "") {
      Swal.fire({
        title: "please fill message!",
        icon: "error",
        draggable: true,
      });
    } else {
      const newTodoData = {
        name: newTodo,
        isCompleted: false,
      };
      const { data, error } = await supabase
        .from("TodoList")
        .insert([newTodoData]);
      // .single();
      if (error) {
        console.log(error);
      } else {
        // setTodoList((pre) => [...pre, data]);
        setNewTodo("");
        setLoading(false);
        // console.log(data);
      }
    }
  };

  const fetchTodoList = async () => {
    const { data, error } = await supabase
      .from("TodoList")
      .select("*")
      // .eq("name", "mingalar")
      .order("id", { ascending: true });
    if (error) {
      console.log(error);
    } else {
      setTodoList(data);
      console.log(data);
    }
  };
  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [todoList]); //
  useEffect(() => {
    fetchTodoList();
    const subscription = supabase
      .channel("realtime-todolist")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "TodoList" },
        (payload) => {
          console.log("Realtime update:", payload);

          if (payload.eventType === "INSERT") {
            setTodoList((prev) => [...prev, payload.new]);
          } else if (payload.eventType === "UPDATE") {
            setTodoList((prev) =>
              prev.map((todo) =>
                todo.id === payload.new.id ? payload.new : todo
              )
            );
          } else if (payload.eventType === "DELETE") {
            setTodoList((prev) =>
              prev.filter((todo) => todo.id !== payload.old.id)
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);
  const completeTask = async (id, isCompleted) => {
    const { data, error } = await supabase
      .from("TodoList")
      .update({ isCompleted: !isCompleted })
      .eq("id", id);
    if (error) {
      console.log(error);
    } else {
      const updateTodoList = todoList.map((list) =>
        list.id == id ? { ...list, isCompleted: !isCompleted } : list
      );
      setTodoList(updateTodoList);
    }
  };
  const deleteTask = async (id) => {
    const { data, error } = await supabase
      .from("TodoList")
      .delete()
      .eq("id", id);
    if (error) {
      console.log(error);
    } else {
      setTodoList((pre) => pre.filter((todo) => todo.id != id));
    }
  };
  return (
    <div className="dark:bg-gray-800 flex flex-col justify-center items-center text-white h-svh">
      <h1 className=" text-3xl font-semibold bg-gray-900 w-5/6 p-2 rounded-xl  my-5 ">
        TTC Chat
      </h1>
      <div className="w-5/6 bg-gray-900 p-5">
        <div
          ref={listRef}
          className=" h-[300px] overflow-scroll custom-scrollbar"
        >
          {
            // todoList.length > 0 &&
            todoList.map((list) => {
              return (
                <div className="  flex justify-end items-center" key={list?.id}>
                  <p className="bg-gray-600 p-2 my-2 rounded-lg">
                    {list?.name}
                  </p>{" "}
                  {/* <button
                    onClick={() => completeTask(list?.id, list?.isCompleted)}
                  >
                    {list?.isCompleted ? "undo" : "complete text"}
                  </button>
                  <button onClick={() => deleteTask(list?.id)}>
                    Delete Tesk
                  </button> */}
                </div>
              );
            })
          }
        </div>
        <div className=" my-4 flex justify-evenly items-center ">
          <input
            className=" border-gray-300 border rounded-md p-2 w-4/5 "
            type="text"
            value={newTodo}
            placeholder="message ..."
            onChange={(e) => setNewTodo(e.target.value)}
          />
          <button
            disabled={loading}
            className=" h-full bg-gray-600 p-2 rounded-full"
            onClick={addTodo}
          >
            {loading ? (
              <VscLoading className="  text-2xl -rotate-12 animate-spin " />
            ) : (
              <BiSolidSend className=" text-2xl -rotate-12 " />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;
