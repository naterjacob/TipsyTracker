import React, {useState, useEffect} from "react";
import Table from "./Table";
import Form from "./Form";

function MyApp() {
  const [characters, setCharacters] = useState([]);

  function removeOneCharacter(index) {
    deleteUser(characters[index]._id)
      .then((res) => {
        if(res.status === 204) {
          const updated = characters.filter((character, i) => {
            return i !== index;
	});
	  setCharacters(updated);
      }
      });
  }


  function updateList(person) {
    postUser(person)
      .then((res) => {
	if(res.status === 201) return res.json();
      })
      .then((data) => { 
	if(data) setCharacters([...characters, data]);
      })
      .catch((error) => {
        console.log(error);
      });
  }

  function fetchUsers() {
    const promise = fetch("http://localhost:8000/users");
    return promise;
  }

  function postUser(person) {
    const promise = fetch("http://localhost:8000/users", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(person),
    });

    return promise;
  }

  function deleteUser(_id) {
    const promise = fetch(`http://localhost:8000/users/${_id}`, {
      method: "DELETE"
    });

    return promise;
  }

  useEffect(() => {
    fetchUsers()
      .then((res) => res.json())
      .then((json) => setCharacters(json["users_list"]))
      .catch((error) => {
        console.log(error);
      });
  },   []);

  return (
    <div className="container">
      <Table
        characterData={characters}
        removeCharacter={removeOneCharacter}
      />
      <Form handleSubmit={updateList}/>
    </div>
  );
}

export default MyApp;
