/**
 * The seal, plotted.
 *
 * This is the Commission's eye reduced to a character grid: `public/circa_eye.png`
 * sampled at 72 columns of alpha, mapped onto a ten-step ramp, and pasted here as
 * text. It costs the browser one `<pre>` instead of an image request, it stays
 * sharp at any zoom, and it prints. It is decoration, so the section that renders
 * it hides it from assistive technology and captions it in words instead.
 *
 * Regenerating it means re-running the sampler against the source artwork and
 * replacing the string; the art is static by design and is never computed at
 * request time.
 */
export const SEAL_PLATE = `                           -@@@@@%#=:
                     .-+%@@#::-+*@@@@@@#:
                -*%@%*=-:.          .-=+#@#:
             :%@@-.    .:=+*+=-:       .-. ...
         :=*@@=   :+@@@@@@@@@@@@@@@%=:   :#@#-.
     .+%@@@#:  .*@@@@@%:..    .:-=%@@@@#.  .*@@@#-
   =@@@@@@-   =@@@@@@+..:-===-:.     +@@@+ ..=@@@@@@=.
 :%@@@@@@*   -@@@@=.=#@@@@@@@@@@@@*:  .@@%: *@@@@@@@@@:
 *@@@@@@+   %@@@- +@@@@=.      :#@@@+   =@@+ +@@@@@@@@#.
:@@@@@@*  .#@@%::@@@*   .-===-.   -      -@@* +@@@@@@@@:
*@@@@@%:  +@@@.-@@@:  :@@@@@@@@@*.        :@@= %@@@@@@@#
@@@@@@+  .%@@=.#@@:  %@@@.    #@@@.        #@#.:@@@@@@@@
@@@@@@=  :@@@ =@@*  *@@*       -@@@.       -@@: @@@@@@@@
@@@@@%.#@@@-                   .#@@:  @@%. .@@%   #@@@@@
@@@@@@:*@@@-                   +@@@  .@@#. :@@#  .%@@@@@
%@@@@@--@@@#.           *%#++%@@@#   #@@=  #@@+  -@@@@@@
=@@@@@*.%@@@-          =@@@@@@@#:  .*@@#  =@@%:  *@@@@@+
.%@@@@@=.%@@@.      ++           :#@@@=  =@@@-  -@@@@@@:
 =@@@@@@:.%@@@=   .#@@@@@+:..=%@@@@@* : *@@@:   @@@@@@+
  *@@@@@@=.*@@@#+:   -#@@@@@@@@@#=.:*@@@@@#.  :@@@@@@*.
   .=@@@@@%::@#@@@@*.     ...  :*%@@@@@@=.   +@@@@@=.
       -%@@@#.  -%@@@@@#=::+@@@@@@@@@#. .+@@@@@#:
          .-*@%=   :+#@@@@@@@@@@@#=:  =%@@%+:
          -#+.   .               .-#@@@@*.
            :#@@@#=:       -%@@@@@@@#=.
               .+@@@@@@*=-:......
                   .-*%@@@@#.`;
