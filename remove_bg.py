from PIL import Image
import sys

def remove_white_background(input_path, output_path, threshold=240):
    """
    Remueve fondo blanco/gris claro de una imagen PNG
    """
    img = Image.open(input_path).convert("RGBA")
    datas = img.getdata()
    
    newData = []
    for item in datas:
        # Si el pixel es blanco/gris claro, hacerlo transparente
        if item[0] > threshold and item[1] > threshold and item[2] > threshold:
            newData.append((255, 255, 255, 0))
        else:
            newData.append(item)
    
    img.putdata(newData)
    img.save(output_path, "PNG")
    print(f"Saved transparent version to {output_path}")

if __name__ == "__main__":
    # Procesar criminal
    remove_white_background(
        "d:/proyectos/juego/public/criminal.png",
        "d:/proyectos/juego/public/criminal_transparent.png",
        threshold=200
    )
    
    # Procesar police
    remove_white_background(
        "d:/proyectos/juego/public/police.png",
        "d:/proyectos/juego/public/police_transparent.png",
        threshold=200
    )
