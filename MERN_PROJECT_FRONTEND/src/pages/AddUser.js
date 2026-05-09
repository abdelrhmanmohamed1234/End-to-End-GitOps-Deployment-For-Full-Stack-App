import { useState } from "react";
import { useNavigate } from "react-router-dom";

const AddUser = () => {
  const navigate = useNavigate();
  const [data, setData] = useState({
    name: "",
    image: "",
  });

  const handleChange = (name) => (e) => {
    const value = name === "image" ? e.target.files[0] : e.target.value;
    setData({ ...data, [name]: value });
  };

  const handleSubmit = async () => {
    try {
     
      if (!data.image) {
        alert("Please select an image first!");
        return;
      }

      let formData = new FormData();
      formData.append("image", data.image);
      formData.append("name", data.name);

      const res = await fetch(`${process.env.REACT_APP_SERVER_URL}/user`, {
        method: "POST",
        body: formData,
      });

      const result = await res.json();

      if (res.ok) {
        setData({ name: "", image: "" });
        navigate("/", { replace: true });
      } else {
        
        alert(`Error: ${result.error || result.message || "Upload failed"}`);
      }
    } catch (error) {
      console.log(error);
      alert("Network Error: Could not connect to server");
    }
  };

  return (
    <div style={{ maxWidth: 500, margin: "auto", paddingTop: "50px" }}>
      <h3 className="text-center mb-4">Add New User</h3>
      <div className="mb-3">
        <input
          className="form-control"
          placeholder="Enter name"
          type="text"
          name="name"
          value={data.name}
          onChange={handleChange("name")}
        />
      </div>
      <div className="mb-3">
        <input
          className="form-control"
          type="file"
          accept="image/*"
          name="image"
          onChange={handleChange("image")}
        />
      </div>
      <div className="text-center">
        <button className="btn btn-primary w-100" onClick={handleSubmit}>
          Submit
        </button>
      </div>
    </div>
  );
};

export default AddUser;
