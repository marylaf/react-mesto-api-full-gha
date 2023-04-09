import { useState, useEffect } from "react";
import { Routes, Route, Link, useNavigate } from "react-router-dom";
import Header from "./Header";
import Main from "./Main";
import Footer from "./Footer";
import ImagePopup from "./ImagePopup";
import EditProfilePopup from "./EditProfilePopup";
import EditAvatarPopup from "./EditAvatarPopup";
import AddPlacePopup from "./AddPlacePopup";
import InfoTooltip from "./InfoTooltip";
import Login from "./Login.js";
import Register from "./Register.js";
import { api } from "../utils/Api";
import CurrentUserContext from "../contexts/CurrentUserContext";
import PopupWithConfirmation from "./PopupWithConfirmation";
import ProtectedRoute from "./ProtectedRoute";
import { apiRegister } from "../utils/apiRegister.js";

function App() {
  const [isEditProfilePopupOpen, setIsEditProfilePopupOpen] = useState(false);
  const [isAddPlacePopupOpen, setIsAddPlacePopupOpen] = useState(false);
  const [isEditAvatarPopupOpen, setIsEditAvatarPopupOpen] = useState(false);
  const [isImagePopupOpen, setIsImagePopupOpen] = useState(false);
  const [isConfirmationPopupOpen, setIsConfirmationPopupOpen] = useState(false);
  const [isInfoTooltip, setIsInfoTooltip] = useState(false);
  const [selectedCard, setSelectedCard] = useState({});
  const [currentUser, setCurrentUser] = useState({});
  const [cards, setCards] = useState([]);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isStatus, setIsStatus] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    // настало время проверить токен
    tokenCheck();
  }, []);

  useEffect(() => {
    Promise.all([api.getProfile(), api.getInitialCards()])
      .then((res) => {
        setCurrentUser(res[0].data);
        setCards(res[1].data);
      })
      .catch(console.log("Ошибка"));
  }, [userEmail]);


  const tokenCheck = () => {

    const jwt = localStorage.getItem("jwt");

    if (jwt) {

      api.setHeaders({
        "Content-Type": "application/json",
        Authorization: `Bearer ${jwt}`,
      });
      apiRegister.setHeaders({
        "Content-Type": "application/json",
        Authorization: `Bearer ${jwt}`,
      });

      apiRegister
        .getGeneral()
        .then((res) => {
          if (res) {
            setIsLoggedIn(true);
            navigate("/", { replace: true });
            setUserEmail(res.data.email);
          }
        })
        .catch((e) => console.log("Ошибка", e));
    }
  };

  function handleLogin(email, password) {
    apiRegister
      .login(email, password)
      .then((res) => {
        localStorage.setItem("jwt", res.token);

        api.setHeaders({
          "Content-Type": "application/json",
          Authorization: `Bearer ${res.token}`,
        });
        apiRegister.setHeaders({
          "Content-Type": "application/json",
          Authorization: `Bearer ${res.token}`,
        });

        setIsLoggedIn(true);
        setUserEmail(email);
        navigate("/", { replace: true });
      })
      .catch((e) => console.log("Ошибка", e))
  }

  function handleRegister(email, password) {
    apiRegister
      .register(email, password)
      .then((res) => {
        setIsStatus(true);
        navigate("/sign-in", { replace: true });
      })
      .catch(() => console.log("Ошибка"))
      .finally(() => {
        handleInfoTooltipOpen();
      });
  }

  function handleEditProfileClick() {
    setIsEditProfilePopupOpen(true);
  }

  function handleConfirmationClick(card) {
    setIsConfirmationPopupOpen(true);
    setSelectedCard(card);
  }

  function handleEditAvatarClick() {
    setIsEditAvatarPopupOpen(true);
  }

  function handleAddPlaceClick() {
    setIsAddPlacePopupOpen(true);
  }

  function handleCardClick(card) {
    setIsImagePopupOpen(true);
    setSelectedCard(card);
  }

  function handleInfoTooltipOpen() {
    setIsInfoTooltip(true);
  }

  function handleSignOut() {
    localStorage.removeItem("jwt");
    setIsLoggedIn(false);
    navigate("/sign-in", { replace: true });

  }

  function deleteCardClick(card) {
    api
      .deleteCard(card._id)
      .then(() => {
        setCards((state) => state.filter((i) => i._id !== card._id));
      })
      .then(() => closeAllPopups())
      .catch(console.log("Ошибка"));
  }

  function handleCardLike(updatedCard) {
    const isLiked = updatedCard.likes.some((like) => like === currentUser._id);
    api
      .changeLikeStatus(updatedCard._id, isLiked)
      .then((res) => {
        setCards((state) => {
      return state.map((card) => 
            (card._id === updatedCard._id ? res.data : card))
        }
        );
      })
      .catch(console.log("Ошибка"));
  }


  function closeAllPopups() {
    setIsEditProfilePopupOpen(false);
    setIsAddPlacePopupOpen(false);
    setIsEditAvatarPopupOpen(false);
    setIsImagePopupOpen(false);
    setIsConfirmationPopupOpen(false);
    setIsInfoTooltip(false);
  }

  function handleUpdateUser(data) {
    api
      .editProfile(data.name, data.about)
      .then((userData) => setCurrentUser(userData.data))
      .then(() => closeAllPopups())
      .catch(console.log("Ошибка"));
  }

  function handleUpdateAvatar(data) {
    api
      .addNewAvatar(data.avatar)
      .then((userData) => setCurrentUser(userData.data))
      .then(() => closeAllPopups())
      .catch(console.log("Ошибка"));
  }

  function handleUpdateCards(data) {
    api
      .addNewCard(data.name, data.link)
      .then((newCard) => {
        setCards([newCard.data, ...cards])
      })
      .then(() => closeAllPopups())
      .catch(console.log("Ошибка"));
  }

  return (
    <div className="page">
      <CurrentUserContext.Provider value={currentUser}>
        <Header userEmail={userEmail} handleSignOut={handleSignOut} />
        <Routes>
          <Route
            path="/"
            element={
              <ProtectedRoute
                isLoggedIn={isLoggedIn}
                element={Main}
                onEditProfile={handleEditProfileClick}
                onEditAvatar={handleEditAvatarClick}
                onAddPlace={handleAddPlaceClick}
                onCardClick={handleCardClick}
                onDeleteClick={handleConfirmationClick}
                onCardLike={handleCardLike}
                cards={cards}
              />
            }
          />
          <Route
            path="/sign-in"
            element={<Login handleLogin={handleLogin} />}
          />
          <Route
            path="/sign-up"
            element={
              <Register
                handleRegister={handleRegister}
                handleInfoTooltipOpen={handleInfoTooltipOpen}
              />
            }
          />
          <Route
            path="/"
            element={!isStatus ? <Link to="/sign-in" /> : <Link to="/" />}
          />
        </Routes>
        <Footer />
        <EditProfilePopup
          onUpdateUser={handleUpdateUser}
          isOpen={isEditProfilePopupOpen}
          onClose={closeAllPopups}
        />
        <AddPlacePopup
          isOpen={isAddPlacePopupOpen}
          onClose={closeAllPopups}
          onUpdateCard={handleUpdateCards}
        />
        <EditAvatarPopup
          isOpen={isEditAvatarPopupOpen}
          onClose={closeAllPopups}
          onUpdateAvatar={handleUpdateAvatar}
        />
        <ImagePopup
          isOpen={isImagePopupOpen}
          card={selectedCard}
          onClose={closeAllPopups}
        />
        <PopupWithConfirmation
          isOpen={isConfirmationPopupOpen}
          onClose={closeAllPopups}
          card={selectedCard}
          onSubmitDeleteCard={deleteCardClick}
        />
        <InfoTooltip
          isStatus={isStatus}
          name="register"
          isOpen={isInfoTooltip}
          onClose={closeAllPopups}
        />
      </CurrentUserContext.Provider>
    </div>
  );
}

export default App;
