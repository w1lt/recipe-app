import { useParams } from "react-router-dom";
import {
  query,
  collection,
  getDocs,
  where,
  updateDoc,
  doc,
  onSnapshot,
} from "firebase/firestore";
import { db } from "../config/firebase";
import { RecipeCard } from "../components/recipeCard";
import { UserContext } from "../App";
import { useContext, useEffect, useState } from "react";
import { Box, Button, Container, Grid, Typography } from "@mui/material";

export const ProfilePage = () => {
  const [userInfo, setUserInfo] = useState({});
  const [userId, setUserId] = useState("");
  const [userRecipes, setUserRecipes] = useState([]);
  const currentUser = useContext(UserContext);
  let { username } = useParams();
  document.title = `CS | ${username}`;

  useEffect(() => {
    const cachedUserInfo = localStorage.getItem(`userInfo_${username}`);
    const cachedRecipeList = localStorage.getItem(`userRecipes_${username}`);

    if (cachedUserInfo) {
      setUserInfo(JSON.parse(cachedUserInfo));
    }
    if (cachedRecipeList) {
      setUserRecipes(JSON.parse(cachedRecipeList));
    }

    const q = query(collection(db, "users"), where("username", "==", username));
    const unsubscribeUserData = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        const userData = snapshot.docs[0].data();
        setUserInfo(userData);
        console.log("Updated user info:");
        setUserId(snapshot.docs[0].id);
        localStorage.setItem(`userInfo_${username}`, JSON.stringify(userData));
      } else {
        console.error("No user found with username:", username);
      }
    });

    return () => {
      unsubscribeUserData();
    };
  }, [username]);

  useEffect(() => {
    if (userId) {
      const q2 = query(
        collection(db, "recipes"),
        where("authorUid", "==", userId)
      );
      const unsubscribeRecipeList = onSnapshot(q2, (snapshot) => {
        const updatedRecipeList = snapshot.docs.map((doc) => ({
          ...doc.data(),
          id: doc.id,
        }));
        setUserRecipes(updatedRecipeList);
        console.log("Updated recipe list:");
        localStorage.setItem(
          `userRecipes_${username}`,
          JSON.stringify(updatedRecipeList)
        );
      });

      return () => {
        unsubscribeRecipeList();
      };
    }
  }, [userId, username]);

  const followUser = async () => {
    const q = query(
      collection(db, "users"),
      where("username", "==", currentUser.displayName)
    );
    const querySnapshot = await getDocs(q);
    const authduserdata = querySnapshot.docs[0].data();
    if (!userInfo.followers.includes(currentUser.uid)) {
      await updateDoc(doc(db, "users", userId), {
        followers: [...userInfo.followers, currentUser.uid],
      });

      await updateDoc(doc(db, "users", currentUser.uid), {
        following: [...authduserdata.followers, userId],
      });

      console.log("Followed user:", username);
    } else {
      if (!window.confirm("Are you sure you want to unfollow this user?"))
        return;
      await updateDoc(doc(db, "users", userId), {
        followers: userInfo.followers.filter(
          (user) => user !== currentUser.uid
        ),
      });
      await updateDoc(doc(db, "users", currentUser.uid), {
        following: authduserdata.followers.filter((user) => user !== userId),
      });
      console.log("Unfollowed user:", username);
    }
  };

  return (
    <>
      <Container component="main" maxWidth="xs">
        <Box
          sx={{
            display: "flex",
            flexDirection: "row",
            justifyContent: "center",
            gap: 1,
          }}
        >
          <Typography variant="h4" component="h1">
            {username}
          </Typography>
          {currentUser.displayName !== username && (
            <Button
              variant={
                userInfo.followers?.includes(currentUser.uid)
                  ? "contained"
                  : "outlined"
              }
              onClick={followUser}
            >
              {userInfo.followers?.includes(currentUser.uid)
                ? "Following"
                : "Follow"}
            </Button>
          )}
        </Box>
        <Box
          sx={{
            display: "flex",
            flexDirection: "row",
            justifyContent: "center",
            gap: 1,
            padding: 2,
            marginBottom: 1,
          }}
        >
          <Typography variant="p" component="h4">
            {userRecipes?.length} Recipes
          </Typography>
          <Typography variant="p" component="h4">
            {userInfo.followers?.length} Followers
          </Typography>
          <Typography variant="p" component="h4">
            {userInfo.following?.length} Following
          </Typography>
        </Box>
      </Container>

      <Container
        //align this to the center of the page
        component="main"
        maxWidth="lg"
      >
        <Box
          sx={{
            display: "flex",
            flexDirection: "row",
            gap: 2,
            flexWrap: "wrap",
            justifyContent: "center",
          }}
        >
          {userRecipes.map((recipe) => (
            <Grid item key={recipe.id}>
              <RecipeCard {...recipe} />
            </Grid>
          ))}
        </Box>
      </Container>
    </>
  );
};
