port module Main exposing (..)

import Html exposing (Html, div, h3, text, input, button)
import Html.Attributes exposing (value)
import Html.Events exposing (onClick, onInput)


{-| Currently, setTitle isn't used in the example (but the JavaScript adds a listener)
-}
port setTitle : String -> Cmd msg


port storageSet : ( String, String ) -> Cmd msg


port storageGet : ( String, String ) -> Cmd msg


port storageGetFinished : (( String, String ) -> msg) -> Sub msg


{-| JavaScript doesn't add a listener to this port, to demontrate what happens if
you forget to add a listener (hint: you get a warning if the port sends data to
JavaScript)
-}
port notListenedPort : String -> Cmd msg


main : Program Never Model Msg
main =
    Html.program
        { init = init
        , view = view
        , update = update
        , subscriptions = subscriptions
        }


type alias Model =
    { path : String, value : String }


type Msg
    = StorageGetFinished ( String, String )
    | SetStorage
    | GetStorage
    | ChangePath String
    | ChangeValue String


init : ( Model, Cmd Msg )
init =
    Model "" "" ! [ notListenedPort "are you listening?" ]


update : Msg -> Model -> ( Model, Cmd Msg )
update msg model =
    case msg of
        StorageGetFinished ( path, value ) ->
            Model path value ! []

        SetStorage ->
            model ! [ storageSet ( model.path, model.value ) ]

        GetStorage ->
            model ! [ storageGet ( model.path, model.path ) ]

        ChangePath path ->
            { model | path = path } ! []

        ChangeValue value ->
            { model | value = value } ! []


subscriptions : Model -> Sub Msg
subscriptions model =
    storageGetFinished StorageGetFinished


view : Model -> Html Msg
view model =
    div []
        [ h3 [] [ text "Path" ]
        , input [ onInput ChangePath, value model.path ] []
        , h3 [] [ text "Value" ]
        , input [ onInput ChangeValue, value model.value ] []
        , div []
            [ button [ onClick SetStorage ] [ text "Set" ]
            , button [ onClick GetStorage ] [ text "Get" ]
            ]
        ]
