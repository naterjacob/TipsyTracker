import { FormEvent, useEffect, useState } from "react";

type User = {
  _id: string;
  name: string;
  job: string;
};

type NewUser = {
  name: string;
  job: string;
};

type UsersResponse = {
  users_list: User[];
};

function App() {
  const [users, setUsers] = useState<User[]>([]);
  const [person, setPerson] = useState<NewUser>({ name: "", job: "" });

  useEffect(() => {
    const loadUsers = async () => {
      try {
        const response = await fetch("http://localhost:8000/users");
        if (!response.ok) {
          throw new Error(`Failed to fetch users (${response.status})`);
        }

        const data = (await response.json()) as UsersResponse;
        setUsers(data.users_list ?? []);
      } catch (error) {
        console.error(error);
      }
    };

    void loadUsers();
  }, []);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    try {
      const response = await fetch("http://localhost:8000/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(person),
      });

      if (response.status !== 201) {
        throw new Error(`Failed to create user (${response.status})`);
      }

      const createdUser = (await response.json()) as User;
      setUsers((currentUsers) => [...currentUsers, createdUser]);
      setPerson({ name: "", job: "" });
    } catch (error) {
      console.error(error);
    }
  };

  const deleteUser = async (id: string) => {
    try {
      const response = await fetch(`http://localhost:8000/users/${id}`, {
        method: "DELETE",
      });

      if (response.status !== 204) {
        throw new Error(`Failed to delete user (${response.status})`);
      }

      setUsers((currentUsers) => currentUsers.filter((user) => user._id !== id));
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="container">
      <h1>TipsyTracker Users</h1>
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Name</th>
            <th>Job</th>
            <th>Remove</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user._id}>
              <td>{user._id}</td>
              <td>{user.name}</td>
              <td>{user.job}</td>
              <td>
                <button onClick={() => void deleteUser(user._id)} type="button">
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <form onSubmit={onSubmit}>
        <label htmlFor="name">Name</label>
        <input
          id="name"
          name="name"
          onChange={(event) =>
            setPerson((currentPerson) => ({
              ...currentPerson,
              name: event.target.value,
            }))
          }
          type="text"
          value={person.name}
        />
        <label htmlFor="job">Job</label>
        <input
          id="job"
          name="job"
          onChange={(event) =>
            setPerson((currentPerson) => ({
              ...currentPerson,
              job: event.target.value,
            }))
          }
          type="text"
          value={person.job}
        />
        <input type="submit" value="Submit" />
      </form>
    </div>
  );
}

export default App;
