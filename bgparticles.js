
tsParticles.load("tsparticles" ,
{
    fpsLimit:60,
    particles : {
        number: {
            value:80
        },
        move: {
            enable: true,
            speed: 0.5,
            random: true,
        },
        rotate: {
            value: {
                min: 0,
                max: 360
            },
            direction: "random",
            move: true,
            animation: {
                enable: true,
                speed: 15
            }
        },
        color: {
            value: "#ffffff",
        },
        shape: {
            type: "square"
        },
        size: {
            value: 5,
            random: true,
            animation: {
                enable: true,
                speed: 20,
                minimumValue: 0.1,
                sync: false
            }
        },
        opacity: {
            value: 1,
            random: true,
            anim: {
                enable: true,
                speed: 1,
                minimumValue: 0.8,
                sync: false
            }

        },
        
    }
});