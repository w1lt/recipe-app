import { useParams } from "react-router-dom";
import { Recipe } from "../components/recipe";
import { useEffect, useState } from "react";
import { db } from "../config/firebase";
import { doc, onSnapshot } from "firebase/firestore";

export const RecipePost = () => {
  let { id } = useParams();
  const [recipe, setRecipe] = useState(null);

  document.title =
    recipe && Object.keys(recipe).length > 0
      ? `CS | ${recipe.name}`
      : "Loading Name...";
  useEffect(() => {
    const unsub = onSnapshot(doc(db, "recipes", id), (doc) => {
      if (doc.exists()) {
        const updatedRecipe = {
          ...doc.data(),
          id: doc.id,
        };
        setRecipe(updatedRecipe);
        localStorage.setItem(`recipeList_${id}`, JSON.stringify(updatedRecipe));
      } else {
        console.log("No such document!");
      }
    });
    return () => unsub();
  }, [id]);
  return (
    <div>
      {recipe && Object.keys(recipe).length > 0 ? (
        <Recipe {...recipe} />
      ) : (
        <h1>loading</h1>
      )}
    </div>
  );
};
