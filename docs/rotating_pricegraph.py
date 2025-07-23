import numpy as np
import matplotlib.pyplot as plt
from matplotlib import cm
import imageio
import os
from PIL import Image

# Parameters
mu_date = 0
mu_weight = 7.6
bound_date = 21
bound_weight = 3
date_sigma = 7
weight_sigma = 1.5
min_price = 2.5
max_price = 25

def gaussian_price(date_dev, weight, date_sigma, weight_sigma):
    exp_date = np.exp(-0.5 * ((date_dev - mu_date) / date_sigma) ** 2)
    exp_weight = np.exp(-0.5 * ((weight - mu_weight) / weight_sigma) ** 2)
    exp_date_extreme = np.exp(-0.5 * (bound_date / date_sigma) ** 2)
    exp_weight_extreme = np.exp(-0.5 * (bound_weight / weight_sigma) ** 2)
    norm_date = (exp_date - exp_date_extreme) / (1 - exp_date_extreme)
    norm_weight = (exp_weight - exp_weight_extreme) / (1 - exp_weight_extreme)
    price = min_price + (max_price - min_price) * norm_date * norm_weight
    return price

date_devs = np.linspace(-bound_date, bound_date, 80)
weights = np.linspace(mu_weight - bound_weight, mu_weight + bound_weight, 60)
X, Y = np.meshgrid(date_devs, weights)
Z = gaussian_price(X, Y, date_sigma, weight_sigma)

os.makedirs("frames", exist_ok=True)

# Dramatic "bounce" in elevation (near top-down at edges)
angles_fwd = np.linspace(0, 90, 40)
angles_bwd = angles_fwd[::-1][1:-1]
angles = np.concatenate([angles_fwd, angles_bwd])

elevs_fwd = np.linspace(25, 80, 40)  # 25° = angled view, 80° = almost top-down
elevs = np.concatenate([elevs_fwd, elevs_fwd[::-1][1:-1]])

for i, (angle, elev) in enumerate(zip(angles, elevs)):
    fig = plt.figure(figsize=(7, 5))
    ax = fig.add_subplot(111, projection='3d')

    # Solid white background (no transparency)
    fig.patch.set_facecolor((1, 1, 1))
    ax.patch.set_facecolor((1, 1, 1))

    surf = ax.plot_surface(X, Y, Z, cmap=cm.inferno, edgecolor='none', antialiased=False)
    ax.set_xlabel('Days from Due Date')
    ax.set_ylabel('Birth Weight (lbs)')
    ax.set_zlabel("")
    ax.view_init(elev=elev, azim=angle)

    z_ticks = [min_price + 0.05*(max_price - min_price), max_price - 0.05*(max_price - min_price)]
    z_ticklabels = ['$', '$$$']
    ax.set_zticks(z_ticks)
    ax.set_zticklabels(z_ticklabels)

    norm = plt.Normalize(vmin=min_price, vmax=max_price)
    m = cm.ScalarMappable(cmap=cm.inferno, norm=norm)
    m.set_array([])
    cb = fig.colorbar(m, ax=ax, shrink=0.7, pad=0.08)
    cb.set_ticks([min_price, max_price])
    cb.set_ticklabels([
        "least expensive\n(least likely numbers)",
        "most expensive\n(most likely numbers)"
    ])
    cb.ax.tick_params(labelsize=9)

    plt.subplots_adjust(right=0.82, left=0.15, bottom=0.18, top=0.95)
    plt.savefig(f"frames/frame_{i:03d}.png", dpi=100, transparent=False)
    plt.close(fig)

# --- Build GIF with pause at start and end using Pillow ---

hold_frames = 2  # Pause at start, fully rotated, and end

filenames = [f"frames/frame_{i:03d}.png" for i in range(len(angles))]
pause_start = [filenames[0]] * hold_frames
pause_middle = [filenames[len(angles_fwd)-1]] * hold_frames  # The last frame of the forward sequence
pause_end = [filenames[-1]] * hold_frames

# Sequence: pause at start, animate forward, pause at middle, animate backward, pause at end
# Forward = filenames[:len(angles_fwd)]
# Backward = filenames[len(angles_fwd):]
full_sequence = (
    pause_start
    + filenames[:len(angles_fwd)]            # Forward
    + pause_middle
    + filenames[len(angles_fwd):]            # Backward
)

# Durations: hold for 600ms at each pause, 140ms for animation frames
durations = (
    [600] * hold_frames
    + [140] * len(angles_fwd)
    + [600] * hold_frames
    + [140] * (len(angles) - len(angles_fwd))
)

# Open images
images = [Image.open(fname) for fname in full_sequence]

# Save GIF
images[0].save(
    "price_surface.gif",
    save_all=True,
    append_images=images[1:],
    duration=durations,
    loop=0
)
